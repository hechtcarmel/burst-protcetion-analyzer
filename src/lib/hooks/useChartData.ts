import { useMemo } from 'react';
import { format } from 'date-fns';
import { formatDuration } from '@/lib/utils/format-duration';
import type { DailyMetrics } from '@/lib/analytics/calculators';

export interface ChartDataPoint extends Omit<DailyMetrics, 'date'> {
  date: number;
  dateLabel: string;
  windowCount?: number;
  windowDuration?: number;
  windowDurationDisplay?: string;
}

export function useChartData(
  data: (DailyMetrics & { windowDuration?: number; windowCount?: number })[]
): ChartDataPoint[] {
  return useMemo(() => {
    return data.map(d => {
      const dateObj = typeof d.date === 'string' ? new Date(d.date) : d.date;
      const windowDuration = d.windowDuration || 0;

      return {
        ...d,
        date: dateObj.getTime(),
        dateLabel: format(dateObj, 'MMM dd'),
        windowCount: d.windowCount || 0,
        windowDuration,
        windowDurationDisplay: formatDuration(windowDuration),
      };
    });
  }, [data]);
}
