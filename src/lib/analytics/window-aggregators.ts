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
    const start = startOfDay(window.start_time);
    const end = startOfDay(window.end_time);

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

      const overlapStart = window.start_time > dayStart ? window.start_time : dayStart;
      const overlapEnd = window.end_time < dayEnd ? window.end_time : dayEnd;

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

      return {
        campaign_id: campaignId,
        campaign_name: campaign?.name,
        windows: windows.sort((a, b) => a.start_time.getTime() - b.start_time.getTime()),
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
    if (filters.startDate && window.end_time < filters.startDate) {
      return false;
    }
    if (filters.endDate && window.start_time > filters.endDate) {
      return false;
    }

    if (filters.campaignIds && filters.campaignIds.length > 0) {
      if (!filters.campaignIds.includes(window.campaign_id)) {
        return false;
      }
    }

    return true;
  });
}
