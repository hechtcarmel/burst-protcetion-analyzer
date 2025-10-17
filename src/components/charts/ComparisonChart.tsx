'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS } from '@/lib/utils/color';
import type { FeatureImpact } from '@/lib/analytics/calculators';

interface ComparisonChartProps {
  data: FeatureImpact[];
  height?: number;
  topN?: number;
}

export default function ComparisonChart({
  data,
  height = 400,
  topN = 10,
}: ComparisonChartProps) {
  const chartData = data.slice(0, topN).map((d) => ({
    name: d.description.substring(0, 20),
    pre: d.preFeatureAvgDepletion,
    post: d.postFeatureAvgDepletion,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />

        <YAxis label={{ value: 'Depletion Rate (%)', angle: -90, position: 'insideLeft' }} />

        <Tooltip />
        <Legend />

        <Bar dataKey="pre" fill={CHART_COLORS.primary.macAvg} name="Pre-Feature" />
        <Bar dataKey="post" fill={CHART_COLORS.primary.depletionRate} name="Post-Feature" />
      </BarChart>
    </ResponsiveContainer>
  );
}
