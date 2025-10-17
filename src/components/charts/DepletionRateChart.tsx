'use client';

import {
  LineChart,
  Line,
  Bar,
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
import { useChartData } from '@/lib/hooks/useChartData';
import { findFeatureDateInChart, isFeatureDateBeforeRange } from '@/lib/utils/chart-helpers';
import { FeatureDateIndicator } from './FeatureDateIndicator';
import type { DailyMetrics } from '@/lib/analytics/calculators';

interface DepletionRateChartProps {
  data: DailyMetrics[];
  height?: number;
  showMacAvg?: boolean;
  featureDate?: Date | string | null;
  showWindowCount?: boolean;
}

export default function DepletionRateChart({
  data,
  height = 400,
  showMacAvg = true,
  featureDate,
  showWindowCount = false,
}: DepletionRateChartProps) {
  const chartData = useChartData(data);

  const featureDateObj = featureDate
    ? (typeof featureDate === 'string' ? new Date(featureDate) : featureDate)
    : null;

  const featureDateLabel = featureDateObj
    ? format(featureDateObj, 'MMM dd, yyyy')
    : null;

  const featureDateX = findFeatureDateInChart(featureDateObj, chartData);
  const isFeatureDateInRange = !!featureDateX;
  const showFeatureDateIndicator = isFeatureDateBeforeRange(featureDateObj, chartData);

  return (
    <div className="w-full space-y-2" style={{ height: showFeatureDateIndicator ? height + 50 : height }}>
      {showFeatureDateIndicator && featureDateObj && (
        <FeatureDateIndicator featureDate={featureDateObj} />
      )}
      <div style={{ height: showFeatureDateIndicator ? height : height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
        >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

        <XAxis
          dataKey="dateLabel"
          angle={-45}
          textAnchor="end"
          height={80}
          className="text-xs"
        />

        <YAxis
          yAxisId="left"
          label={{
            value: 'Depletion Rate (%)',
            angle: -90,
            position: 'insideLeft',
          }}
          className="text-xs"
        />

        {showWindowCount && (
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{
              value: 'Time Active (min)',
              angle: 90,
              position: 'insideRight',
            }}
            className="text-xs"
          />
        )}

        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;

            const data = payload[0].payload;
            return (
              <div className="bg-card/95 backdrop-blur-sm border-2 rounded-lg shadow-xl p-4">
                <p className="font-semibold mb-3 border-b pb-2">
                  {format(new Date(data.date), 'PPP')}
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
                    return (
                      <div key={entry.name} className="flex items-center justify-between text-sm gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-muted-foreground">{entry.name}:</span>
                        </div>
                        <span className="font-semibold tabular-nums">{entry.value.toFixed(2)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }}
        />

        <Legend />

        <ReferenceLine
          y={100}
          stroke={CHART_COLORS.status.blocked}
          strokeDasharray="3 3"
          label="Budget Limit"
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

{showWindowCount && (
          <Bar
            yAxisId="right"
            dataKey="windowDuration"
            name="Time Active"
            fill="#8b5cf6"
            fillOpacity={0.4}
            radius={[4, 4, 0, 0]}
          />
        )}

        <Line
          yAxisId="left"
          type="monotone"
          dataKey="avgDepletionRate"
          stroke={CHART_COLORS.primary.depletionRate}
          strokeWidth={2}
          name="Avg Depletion Rate"
          dot={false}
          activeDot={{ r: 6 }}
        />

        {showMacAvg && (
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="macAvg"
            stroke={CHART_COLORS.primary.macAvg}
            strokeWidth={2}
            strokeDasharray="5 5"
            name="MAX_CONVERSIONS Avg"
            dot={false}
            activeDot={{ r: 6 }}
          />
        )}

        <Brush
          dataKey="dateLabel"
          height={30}
          stroke={CHART_COLORS.primary.depletionRate}
        />
      </LineChart>
    </ResponsiveContainer>
    </div>
    </div>
  );
}
