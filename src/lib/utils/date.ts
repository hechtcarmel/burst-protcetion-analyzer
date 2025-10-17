import { format as dateFnsFormat, subDays, startOfDay, endOfDay } from 'date-fns';

export function formatDate(date: Date, formatStr: string = 'MMM dd, yyyy'): string {
  return dateFnsFormat(date, formatStr);
}

export function getDateRangePreset(preset: '7d' | '14d' | '30d' | '90d'): { start: Date; end: Date } {
  const end = endOfDay(new Date());
  const days = preset === '7d' ? 7 : preset === '14d' ? 14 : preset === '30d' ? 30 : 90;
  const start = startOfDay(subDays(end, days));
  return { start, end };
}
