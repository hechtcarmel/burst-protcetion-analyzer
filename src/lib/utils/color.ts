export const CHART_COLORS = {
  primary: {
    depletionRate: '#3b82f6',    // Blue
    macAvg: '#8b5cf6',            // Purple
    spikes: '#f59e0b',            // Amber
    blocking: '#10b981',          // Emerald
  },
  status: {
    blocked: '#ef4444',           // Red
    notBlocked: '#10b981',        // Green
  },
  performance: {
    excellent: '#10b981',         // Green
    good: '#3b82f6',              // Blue
    warning: '#f59e0b',           // Amber
    critical: '#ef4444',          // Red
  },
  gradient: {
    depletionLow: 'rgba(16, 185, 129, 0.1)',     // Green bg
    depletionMedium: 'rgba(59, 130, 246, 0.1)',  // Blue bg
    depletionHigh: 'rgba(245, 158, 11, 0.1)',    // Amber bg
    depletionCritical: 'rgba(239, 68, 68, 0.1)', // Red bg
  },
  heatmap: [
    '#e0f2fe',  // Blue 50
    '#7dd3fc',  // Blue 300
    '#38bdf8',  // Blue 400
    '#0ea5e9',  // Blue 500
    '#0284c7',  // Blue 600
  ],
  timePeriod: {
    beforeFeature: '#94a3b8',     // Gray
    afterFeature: '#3b82f6',      // Blue
  },
} as const;

export function getDepletionRateColor(rate: number): string {
  if (rate < 50) return CHART_COLORS.performance.excellent;
  if (rate < 75) return CHART_COLORS.performance.good;
  if (rate < 90) return CHART_COLORS.performance.warning;
  return CHART_COLORS.performance.critical;
}

export function getDepletionRateStatus(rate: number): 'excellent' | 'good' | 'warning' | 'critical' {
  if (rate < 50) return 'excellent';
  if (rate < 75) return 'good';
  if (rate < 90) return 'warning';
  return 'critical';
}

export function getDepletionRateLabel(rate: number): string {
  const status = getDepletionRateStatus(rate);
  return {
    excellent: 'Excellent',
    good: 'Good',
    warning: 'High',
    critical: 'Critical',
  }[status];
}

export function getHeatmapColor(value: number, max: number): string {
  const percentage = (value / max) * 100;
  const index = Math.min(Math.floor(percentage / 20), 4);
  return CHART_COLORS.heatmap[index];
}
