import { format } from 'date-fns';

export function formatChartDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM dd');
}

export function findFeatureDateInChart(
  featureDate: Date | string | null,
  chartData: Array<{ date: number | Date; dateLabel?: string }>
): string | null {
  if (!featureDate || chartData.length === 0) {
    return null;
  }

  const targetDate = new Date(featureDate);
  targetDate.setHours(0, 0, 0, 0);
  const targetTime = targetDate.getTime();

  const match = chartData.find(d => {
    const chartDate = new Date(typeof d.date === 'number' ? d.date : d.date);
    chartDate.setHours(0, 0, 0, 0);
    const chartTime = chartDate.getTime();
    const dayDiff = Math.abs(chartTime - targetTime) / (1000 * 60 * 60 * 24);
    return dayDiff < 0.5;
  });

  return match?.dateLabel || null;
}

export function isFeatureDateBeforeRange(
  featureDate: Date | string | null,
  chartData: Array<{ date: number | Date }>
): boolean {
  if (!featureDate || chartData.length === 0) {
    return false;
  }

  const featureDateObj = new Date(featureDate);
  const firstDataDate = typeof chartData[0].date === 'number'
    ? chartData[0].date
    : chartData[0].date.getTime();

  return featureDateObj.getTime() < firstDataDate;
}
