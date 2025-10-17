import type { BurstProtectionRow } from '@/lib/db/types';
import { aggregateByDay, aggregateByAccount, type DailyMetrics, type AccountSummary } from './aggregators';

export interface FeatureImpact {
  advertiser_id: number;
  description: string;
  preFeatureAvgDepletion: number;
  postFeatureAvgDepletion: number;
  preFeatureSpikes: number;
  postFeatureSpikes: number;
  improvementRate: number;
  daysPreFeature: number;
  daysPostFeature: number;
}

export interface KPIMetrics {
  totalAccounts: number;
  accountsWithFeature: number;
  avgDepletionRate: number;
  totalSpikes: number;
  dailyAvgSpikes: number;
  blockingPercentage: number;
  totalBlockingAmount: number;
  trend: {
    depletionRate: 'up' | 'down' | 'stable';
    spikes: 'up' | 'down' | 'stable';
  };
}

export interface DashboardMetrics {
  kpis: KPIMetrics;
  dailyMetrics: DailyMetrics[];
  accountSummaries: AccountSummary[];
  featureImpact: FeatureImpact[];
}

export function calculateMetrics(data: BurstProtectionRow[]): DashboardMetrics {
  const dailyMetrics = aggregateByDay(data);
  const accountSummaries = aggregateByAccount(data);
  const featureImpact = calculateFeatureImpact(data);
  const kpis = calculateKPIs(data, dailyMetrics);

  return {
    kpis,
    dailyMetrics,
    accountSummaries,
    featureImpact,
  };
}

function calculateKPIs(
  data: BurstProtectionRow[],
  dailyMetrics: DailyMetrics[]
): KPIMetrics {
  const uniqueAccounts = new Set(data.map(r => r.advertiser_id)).size;

  const validDepletionRates = data
    .filter(r => r.avg_depletion_rate !== null)
    .map(r => r.avg_depletion_rate!);

  const avgDepletionRate = validDepletionRates.length > 0
    ? validDepletionRates.reduce((a, b) => a + b, 0) / validDepletionRates.length
    : 0;

  const totalSpikes = data.reduce((sum, r) => sum + (r.spikes_count || 0), 0);

  const uniqueDays = new Set(
    data.map(r => r.data_timestamp_by_request_time.toDateString())
  ).size;

  const dailyAvgSpikes = uniqueDays > 0 ? totalSpikes / uniqueDays : 0;

  const blockedRows = data.filter(r => r.blocking_status === 'BLOCKED').length;
  const blockingPercentage = data.length > 0 ? (blockedRows / data.length) * 100 : 0;

  const totalBlockingAmount = data.reduce(
    (sum, r) => sum + (r.amount_of_blocking || 0),
    0
  );

  // Calculate trends (compare first half vs second half)
  const midpoint = Math.floor(dailyMetrics.length / 2);
  const firstHalf = dailyMetrics.slice(0, midpoint);
  const secondHalf = dailyMetrics.slice(midpoint);

  const firstHalfAvgDepletion = firstHalf.length > 0
    ? firstHalf.reduce((sum, d) => sum + d.avgDepletionRate, 0) / firstHalf.length
    : 0;

  const secondHalfAvgDepletion = secondHalf.length > 0
    ? secondHalf.reduce((sum, d) => sum + d.avgDepletionRate, 0) / secondHalf.length
    : 0;

  const firstHalfAvgSpikes = firstHalf.length > 0
    ? firstHalf.reduce((sum, d) => sum + d.totalSpikes, 0) / firstHalf.length
    : 0;

  const secondHalfAvgSpikes = secondHalf.length > 0
    ? secondHalf.reduce((sum, d) => sum + d.totalSpikes, 0) / secondHalf.length
    : 0;

  const depletionTrend =
    Math.abs(secondHalfAvgDepletion - firstHalfAvgDepletion) < 5 ? 'stable' :
    secondHalfAvgDepletion > firstHalfAvgDepletion ? 'up' : 'down';

  const spikesTrend =
    Math.abs(secondHalfAvgSpikes - firstHalfAvgSpikes) < 1 ? 'stable' :
    secondHalfAvgSpikes > firstHalfAvgSpikes ? 'up' : 'down';

  return {
    totalAccounts: uniqueAccounts,
    accountsWithFeature: uniqueAccounts,
    avgDepletionRate,
    totalSpikes,
    dailyAvgSpikes,
    blockingPercentage,
    totalBlockingAmount,
    trend: {
      depletionRate: depletionTrend,
      spikes: spikesTrend,
    },
  };
}

function calculateFeatureImpact(data: BurstProtectionRow[]): FeatureImpact[] {
  const accountMap = new Map<number, BurstProtectionRow[]>();

  data.forEach(row => {
    if (!accountMap.has(row.advertiser_id)) {
      accountMap.set(row.advertiser_id, []);
    }
    accountMap.get(row.advertiser_id)!.push(row);
  });

  return Array.from(accountMap.entries())
    .map(([advertiserId, rows]) => {
      const featureDate = rows[0].feature_date;

      const preFeatureRows = rows.filter(
        r => r.data_timestamp_by_request_time < featureDate
      );

      const postFeatureRows = rows.filter(
        r => r.data_timestamp_by_request_time >= featureDate
      );

      const preDepletionRates = preFeatureRows
        .filter(r => r.avg_depletion_rate !== null)
        .map(r => r.avg_depletion_rate!);

      const postDepletionRates = postFeatureRows
        .filter(r => r.avg_depletion_rate !== null)
        .map(r => r.avg_depletion_rate!);

      const preAvg = preDepletionRates.length > 0
        ? preDepletionRates.reduce((a, b) => a + b, 0) / preDepletionRates.length
        : 0;

      const postAvg = postDepletionRates.length > 0
        ? postDepletionRates.reduce((a, b) => a + b, 0) / postDepletionRates.length
        : 0;

      const preSpikes = preFeatureRows.reduce(
        (sum, r) => sum + (r.spikes_count || 0),
        0
      );

      const postSpikes = postFeatureRows.reduce(
        (sum, r) => sum + (r.spikes_count || 0),
        0
      );

      const improvement = preAvg > 0
        ? ((preAvg - postAvg) / preAvg) * 100
        : 0;

      return {
        advertiser_id: advertiserId,
        description: rows[0].description,
        preFeatureAvgDepletion: preAvg,
        postFeatureAvgDepletion: postAvg,
        preFeatureSpikes: preSpikes,
        postFeatureSpikes: postSpikes,
        improvementRate: improvement,
        daysPreFeature: preFeatureRows.length,
        daysPostFeature: postFeatureRows.length,
      };
    })
    .filter(impact => impact.daysPreFeature > 0 && impact.daysPostFeature > 0)
    .sort((a, b) => b.improvementRate - a.improvementRate);
}

export type { DailyMetrics, AccountSummary };
