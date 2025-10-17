'use client';

import MetricCard from '@/components/cards/MetricCard';
import { Users, TrendingUp, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { KPIMetrics } from '@/lib/analytics/calculators';
import { formatLargeNumber, formatPercent } from '@/lib/utils/format';

interface MetricsCardsProps {
  metrics?: KPIMetrics;
  loading?: boolean;
}

export default function MetricsCards({ metrics, loading }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total Accounts"
        value={metrics ? formatLargeNumber(metrics.totalAccounts) : '-'}
        subtitle={`${metrics?.accountsWithFeature || 0} with feature enabled`}
        icon={<Users className="h-5 w-5" />}
        loading={loading}
        variant="accounts"
        index={0}
      />

      <MetricCard
        title="Avg Depletion Rate"
        value={metrics ? formatPercent(metrics.avgDepletionRate) : '-'}
        subtitle="Overall average"
        trend={metrics?.trend.depletionRate}
        icon={<TrendingUp className="h-5 w-5" />}
        loading={loading}
        variant="depletion"
        index={1}
      />

      <MetricCard
        title="Total Spikes"
        value={metrics ? formatLargeNumber(metrics.totalSpikes) : '-'}
        subtitle={`${metrics ? metrics.dailyAvgSpikes.toFixed(1) : '-'} per day`}
        trend={metrics?.trend.spikes}
        icon={<AlertTriangle className="h-5 w-5" />}
        loading={loading}
        variant="spikes"
        index={2}
      />

      <MetricCard
        title="Blocking Activity"
        value={metrics ? formatPercent(metrics.blockingPercentage) : '-'}
        subtitle={`$${metrics ? formatLargeNumber(metrics.totalBlockingAmount) : '-'} blocked`}
        icon={<ShieldAlert className="h-5 w-5" />}
        loading={loading}
        variant="blocking"
        index={3}
      />
    </div>
  );
}
