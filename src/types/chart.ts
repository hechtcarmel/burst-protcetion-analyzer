export interface BaseChartProps {
  height?: number;
  loading?: boolean;
  error?: Error | null;
}

export interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string; dataKey?: string }>;
  label?: string;
}

export interface LegendProps {
  payload?: Array<{ value: string; type?: string; color?: string }>;
}
