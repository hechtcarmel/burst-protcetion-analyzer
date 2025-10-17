'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CHART_COLORS } from '@/lib/utils/color';
import { formatPercent } from '@/lib/utils/format';
import type { AccountSummary } from '@/lib/analytics/calculators';
import type { BurstProtectionRow } from '@/lib/db/types';

interface AccountSparklineProps {
  advertiser_id: number;
  description: string;
  data: BurstProtectionRow[];
  metrics: AccountSummary;
}

export default function AccountSparkline({
  description,
  data,
  metrics,
}: AccountSparklineProps) {
  const chartData = data
    .filter((d) => d.avg_depletion_rate !== null)
    .map((d) => ({
      value: d.avg_depletion_rate,
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium truncate">{description}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={CHART_COLORS.primary.depletionRate}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-between text-xs mt-2">
          <span>Avg: {formatPercent(metrics.avgDepletionRate)}</span>
          <span>Spikes: {metrics.totalSpikes}</span>
          <Badge variant={metrics.blockingDays > 0 ? 'destructive' : 'secondary'}>
            {metrics.blockingDays}d blocked
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
