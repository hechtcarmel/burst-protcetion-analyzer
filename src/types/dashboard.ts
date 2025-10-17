import type { ReactNode } from 'react';

export type TrendDirection = 'up' | 'down' | 'stable';

export interface MetricCardData {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: TrendDirection;
  icon?: ReactNode;
}
