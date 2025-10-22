import { format, startOfDay } from 'date-fns';
import type { WindowRow, WindowMetrics, CampaignWindow } from '@/types/window';
import type { Campaign } from '@/lib/db/types';

interface TimeInterval {
  start: number;
  end: number;
}

function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return [];

  const sorted = intervals.sort((a, b) => a.start - b.start);
  const merged: TimeInterval[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const lastMerged = merged[merged.length - 1];

    if (current.start <= lastMerged.end) {
      lastMerged.end = Math.max(lastMerged.end, current.end);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

export function aggregateWindowsByDay(windows: WindowRow[]): WindowMetrics[] {
  const dailyMap = new Map<string, { date: Date; intervals: TimeInterval[]; campaigns: Set<number>; windowCount: number }>();

  windows.forEach(window => {
    // Ensure dates are Date objects
    const startTime = window.start_time instanceof Date ? window.start_time : new Date(window.start_time);
    const endTime = window.end_time instanceof Date ? window.end_time : new Date(window.end_time);

    const start = startOfDay(startTime);
    const end = startOfDay(endTime);

    let current = new Date(start);
    while (current <= end) {
      const dateKey = format(current, 'yyyy-MM-dd');

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: new Date(current),
          intervals: [],
          campaigns: new Set(),
          windowCount: 0,
        });
      }

      const metrics = dailyMap.get(dateKey)!;
      metrics.windowCount++;
      metrics.campaigns.add(window.campaign_id);

      const dayStart = new Date(current);
      const dayEnd = new Date(current);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const overlapStart = startTime > dayStart ? startTime : dayStart;
      const overlapEnd = endTime < dayEnd ? endTime : dayEnd;

      metrics.intervals.push({
        start: overlapStart.getTime(),
        end: overlapEnd.getTime(),
      });

      current = new Date(current);
      current.setDate(current.getDate() + 1);
    }
  });

  return Array.from(dailyMap.entries())
    .map(([, data]) => {
      const mergedIntervals = mergeIntervals(data.intervals);
      const totalDurationMs = mergedIntervals.reduce((sum, interval) => {
        return sum + (interval.end - interval.start);
      }, 0);

      return {
        date: data.date,
        windowCount: data.windowCount,
        totalDuration: totalDurationMs / (1000 * 60),
        campaigns: Array.from(data.campaigns),
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function aggregateWindowsByCampaign(
  windows: WindowRow[],
  campaigns?: Campaign[]
): CampaignWindow[] {
  const campaignMap = new Map<number, WindowRow[]>();

  windows.forEach(window => {
    if (!campaignMap.has(window.campaign_id)) {
      campaignMap.set(window.campaign_id, []);
    }
    campaignMap.get(window.campaign_id)!.push(window);
  });

  return Array.from(campaignMap.entries())
    .map(([campaignId, windows]) => {
      const campaign = campaigns?.find(c => c.id === campaignId);
      const totalDuration = windows.reduce((sum, w) => sum + w.window_duration_minutes, 0);

      // Sort windows by start time, ensuring dates are Date objects
      const sortedWindows = windows.sort((a, b) => {
        const aStartTime = a.start_time instanceof Date ? a.start_time : new Date(a.start_time);
        const bStartTime = b.start_time instanceof Date ? b.start_time : new Date(b.start_time);
        return aStartTime.getTime() - bStartTime.getTime();
      });

      return {
        campaign_id: campaignId,
        campaign_name: campaign?.name,
        windows: sortedWindows,
        totalWindows: windows.length,
        totalDuration,
      };
    })
    .sort((a, b) => b.totalWindows - a.totalWindows);
}

export function filterWindows(
  windows: WindowRow[],
  filters: {
    startDate?: Date;
    endDate?: Date;
    campaignIds?: number[];
  }
): WindowRow[] {
  return windows.filter(window => {
    // Ensure dates are Date objects
    const startTime = window.start_time instanceof Date ? window.start_time : new Date(window.start_time);
    const endTime = window.end_time instanceof Date ? window.end_time : new Date(window.end_time);

    if (filters.startDate && endTime < filters.startDate) {
      return false;
    }
    if (filters.endDate) {
      // Make endDate inclusive of the entire day by setting to end of day
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (startTime > endOfDay) {
        return false;
      }
    }

    if (filters.campaignIds && filters.campaignIds.length > 0) {
      if (!filters.campaignIds.includes(window.campaign_id)) {
        return false;
      }
    }

    return true;
  });
}
