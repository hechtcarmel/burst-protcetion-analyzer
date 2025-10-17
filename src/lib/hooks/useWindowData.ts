import { useMemo } from 'react';
import { format } from 'date-fns';
import { useWindows } from '@/lib/contexts/WindowContext';
import type { DailyMetrics } from '@/lib/analytics/calculators';

interface WindowDataFilters {
  startDate?: string;
  endDate?: string;
  campaignIds?: number[];
}

interface Campaign {
  id: number;
  name: string;
  advertiser_id: number;
  status?: string;
}

export function useWindowData(
  dailyMetrics: DailyMetrics[],
  filters: WindowDataFilters,
  campaigns: Campaign[]
) {
  const { hasData, getDailyMetrics, getCampaignMetrics } = useWindows();

  const windowDailyMetrics = useMemo(() => {
    if (!hasData) return [];

    return getDailyMetrics({
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      campaignIds: filters.campaignIds,
    });
  }, [hasData, getDailyMetrics, filters.startDate, filters.endDate, filters.campaignIds]);

  const campaignWindows = useMemo(() => {
    if (!hasData) return [];

    return getCampaignMetrics(
      {
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        campaignIds: filters.campaignIds,
      },
      campaigns
    );
  }, [hasData, getCampaignMetrics, filters.startDate, filters.endDate, filters.campaignIds, campaigns]);

  const mergedDailyMetrics = useMemo(() => {
    return dailyMetrics.map(dm => {
      const windowMetric = windowDailyMetrics.find(wm =>
        format(wm.date, 'yyyy-MM-dd') === format(dm.date, 'yyyy-MM-dd')
      );

      return {
        ...dm,
        windowCount: windowMetric?.windowCount || 0,
        windowDuration: windowMetric?.totalDuration || 0,
      };
    });
  }, [dailyMetrics, windowDailyMetrics]);

  return {
    hasData,
    mergedDailyMetrics,
    campaignWindows,
  };
}
