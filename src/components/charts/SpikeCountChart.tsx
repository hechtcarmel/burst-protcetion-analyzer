'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from 'recharts';
import { format } from 'date-fns';
import { CHART_COLORS } from '@/lib/utils/color';
import { formatDuration } from '@/lib/utils/format-duration';
import type { DailyMetrics } from '@/lib/analytics/calculators';

interface SpikeCountChartProps {
  data: DailyMetrics[];
  height?: number;
  featureDate?: Date | string | null;
  showWindowCount?: boolean;
}

export default function SpikeCountChart({ data, height = 350, featureDate, showWindowCount = false }: SpikeCountChartProps) {
  const chartData = data.map((d) => {
    const dateObj = typeof d.date === 'string' ? new Date(d.date) : d.date;
    const extendedData = d as DailyMetrics & { windowDuration?: number; windowCount?: number };
    const windowDuration = extendedData.windowDuration || 0;
    return {
      date: format(dateObj, 'MMM dd'),
      dateTimestamp: dateObj.getTime(),
      spikes: d.totalSpikes,
      depletionRate: d.avgDepletionRate,
      windowCount: extendedData.windowCount || 0,
      windowDuration: windowDuration,
      windowDurationDisplay: formatDuration(windowDuration),
    };
  });

  // Find the feature date in the chart data
  const featureDateObj = featureDate
    ? (typeof featureDate === 'string' ? new Date(featureDate) : featureDate)
    : null;

  const featureDateLabel = featureDateObj
    ? format(featureDateObj, 'MMM dd, yyyy')
    : null;

  // Find the matching dateLabel for the feature date (to match XAxis dataKey)
  // Normalize both dates to midnight UTC for comparison
  const featureDateX = featureDateObj && chartData.length > 0
    ? (() => {
        const targetDate = new Date(featureDateObj);
        targetDate.setHours(0, 0, 0, 0);
        const targetTime = targetDate.getTime();

        const match = chartData.find(d => {
          const chartDate = new Date(d.dateTimestamp);
          chartDate.setHours(0, 0, 0, 0);
          const chartTime = chartDate.getTime();
          const dayDiff = Math.abs(chartTime - targetTime) / (1000 * 60 * 60 * 24);
          return dayDiff < 0.5; // Within half a day
        });

        return match?.date;
      })()
    : null;

  // Check if feature date is within the visible date range
  const isFeatureDateInRange = !!featureDateX;
  const isFeatureDateBeforeRange = featureDateObj && chartData.length > 0 &&
    featureDateObj.getTime() < chartData[0].dateTimestamp;

  return (
    <div className="w-full space-y-2" style={{ height: isFeatureDateBeforeRange ? height + 50 : height }}>
      {/* Show indicator when feature date is before the visible range */}
      {isFeatureDateBeforeRange && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border-l-4 border-emerald-500 rounded-r w-fit">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-emerald-700">Feature Enabled</p>
              <p className="text-xs text-emerald-600">{featureDateLabel}</p>
            </div>
          </div>
        </div>
      )}
      <div style={{ height: isFeatureDateBeforeRange ? height : height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 50, right: showWindowCount ? 100 : 80, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

        <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />

        <YAxis
          yAxisId="left"
          label={{ value: 'Spike Count', angle: 0, position: 'top', offset: 20 }}
        />

{!showWindowCount && (
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: 'Depletion Rate (%)', angle: 0, position: 'top', offset: 20 }}
          />
        )}

        {showWindowCount && (
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: 'Depletion Rate (%)', angle: 0, position: 'top', offset: 20 }}
          />
        )}

        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;

            const data = payload[0].payload;
            return (
              <div className="bg-card/95 backdrop-blur-sm border-2 rounded-lg shadow-xl p-4">
                <p className="font-semibold mb-3 border-b pb-2">
                  {format(new Date(data.dateTimestamp), 'PPP')}
                </p>
                <div className="space-y-2">
                  {payload.map((entry: { name: string; value: number; color?: string; dataKey?: string }) => {
                    if (entry.dataKey === 'windowDuration') {
                      return (
                        <div key={entry.name} className="flex items-center justify-between text-sm gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-muted-foreground">{entry.name}:</span>
                          </div>
                          <span className="font-semibold">{data.windowDurationDisplay}</span>
                        </div>
                      );
                    }
                    const value = entry.dataKey === 'spikes'
                      ? entry.value
                      : `${entry.value.toFixed(2)}%`;
                    return (
                      <div key={entry.name} className="flex items-center justify-between text-sm gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-muted-foreground">{entry.name}:</span>
                        </div>
                        <span className="font-semibold tabular-nums">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }}
        />
        <Legend />

        <Bar
          yAxisId="left"
          dataKey="spikes"
          fill={CHART_COLORS.primary.spikes}
          fillOpacity={0.6}
          name="Spikes"
        />

        {showWindowCount && (
          <Bar
            yAxisId="right"
            dataKey="windowDuration"
            name="Time Active"
            fill="#8b5cf6"
            fillOpacity={0.4}
          />
        )}

        <Line
          yAxisId="right"
          type="monotone"
          dataKey="depletionRate"
          stroke={CHART_COLORS.primary.depletionRate}
          strokeWidth={2}
          name="Depletion Rate"
          dot={false}
        />

        {isFeatureDateInRange && (
          <ReferenceLine
            x={featureDateX}
            stroke="#10b981"
            strokeWidth={2}
            yAxisId="left"
            label={{
              value: `Feature Enabled: ${featureDateLabel}`,
              position: 'top',
              fill: '#10b981',
              fontSize: 12,
              fontWeight: 'bold',
            }}
          />
        )}

        <Brush
          dataKey="date"
          height={30}
          stroke={CHART_COLORS.primary.spikes}
        />
      </ComposedChart>
    </ResponsiveContainer>
    </div>
    </div>
  );
}
