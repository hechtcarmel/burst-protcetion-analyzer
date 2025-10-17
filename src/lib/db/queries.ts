import { executeQuery } from './vertica';
import { BurstProtectionRowSchema } from './schema';
import type { BurstProtectionRow, QueryFilters, Campaign } from './types';
import { buildFilterCondition, buildDateRangeCondition } from './query-builder';

function buildFilteredQuery(filters?: QueryFilters): string {
  const advertiserFilter = filters?.advertiserId
    ? `AND ${buildFilterCondition('pc.publisher_id', filters.advertiserId)}`
    : '';

  const campaignFilter = filters?.campaignId
    ? `AND ${buildFilterCondition('actual.campaign_id', filters.campaignId)}`
    : '';

  const dateFilter = filters?.startDate && filters?.endDate
    ? `AND ${buildDateRangeCondition('actual.data_timestamp_by_request_time', filters.startDate, filters.endDate)}`
    : '';

  const dateFilterExpected = filters?.startDate && filters?.endDate
    ? `AND ${buildDateRangeCondition('expected.data_timestamp', filters.startDate, filters.endDate)}`
    : '';

  const dateFilterBlindspot = filters?.startDate && filters?.endDate
    ? `AND ${buildDateRangeCondition('b.data_timestamp', filters.startDate, filters.endDate)}`
    : '';

  const dateFilterSpikes = filters?.startDate && filters?.endDate
    ? `AND ${buildDateRangeCondition('r.spike_date_utc', filters.startDate, filters.endDate)}`
    : '';

  return `
WITH config_publishers AS (
  SELECT publisher_id, date(pc.update_time) AS feature_date
  FROM trc.publisher_config pc
  WHERE attribute = 'spending-burst-protection:is-enabled-for-publisher'
    AND publisher_id IS NOT NULL
    ${advertiserFilter}
),
accounts AS (
  SELECT
    coalesce(n.publisher_id, cp.publisher_id) AS advertiser_id,
    IF(network_owner IS NOT NULL, 'NETWORK LEVEL', 'ACCOUNT LEVEL') AS config_level,
    feature_date
  FROM config_publishers cp
  LEFT JOIN trc.networks n ON cp.publisher_id = n.network_owner
),
actual_spent AS (
  SELECT
    data_timestamp_by_request_time,
    account_id,
    campaign_id,
    sum(spent) AS sum_spent
  FROM reports.advertiser_dimensions_by_request_time_report_daily actual
  JOIN accounts a ON a.advertiser_id = actual.account_id
  WHERE actual.data_timestamp_by_request_time > a.feature_date - 14
    ${dateFilter}
    ${campaignFilter}
  GROUP BY data_timestamp_by_request_time, account_id, campaign_id
),
expected_spent AS (
  SELECT
    data_timestamp,
    advertiser_id,
    campaign_id,
    last_calculated_effective_daily_limit
  FROM reports.campaign_effective_daily_limit_calculations_report_daily expected
  JOIN accounts a ON a.advertiser_id = expected.syndicator_id
  WHERE expected.data_timestamp > a.feature_date - 14
    ${dateFilterExpected}
),
campaign_data AS (
  SELECT
    data_timestamp_by_request_time,
    a.account_id,
    a.campaign_id,
    c.cpc_optimization_sub_type,
    a.sum_spent,
    e.last_calculated_effective_daily_limit,
    100 * a.sum_spent / e.last_calculated_effective_daily_limit AS depletion_rate,
    ac.feature_date
  FROM actual_spent a
  LEFT JOIN expected_spent e ON e.campaign_id = a.campaign_id
    AND a.data_timestamp_by_request_time = e.data_timestamp
  LEFT JOIN accounts ac ON ac.advertiser_id = a.account_id
  JOIN trc.sp_campaign_details_v2 c ON c.id = a.campaign_id
),
account_data AS (
  SELECT
    data_timestamp_by_request_time,
    account_id,
    COALESCE(AVG(CASE WHEN cpc_optimization_sub_type = 'MAX_CONVERSIONS' THEN depletion_rate END), 0) AS mac_avg,
    AVG(depletion_rate) AS avg_depletion_rate
  FROM campaign_data
  GROUP BY data_timestamp_by_request_time, account_id
),
blocking_data AS (
  SELECT
    data_timestamp,
    syndicator_id,
    SUM(VALUE) AS amount_of_blocking
  FROM reports.blindspot_v5 b
  JOIN accounts a ON a.advertiser_id = b.syndicator_id
  WHERE cell_name = 'SPENDING_BURST_PROTECTION_FILTER'
    AND b.data_timestamp > feature_date - 1
    ${dateFilterBlindspot}
  GROUP BY data_timestamp, syndicator_id
),
spikes AS (
  SELECT
    advertiser_id,
    spike_date_utc,
    a.feature_date,
    SUM(CASE
      WHEN bidding_strategy_during_spike = 'MAX_CONVERSIONS' AND relative_to_budget_spike = 1 THEN 1
      WHEN bidding_strategy_during_spike = 'MAX_VALUE' AND relative_to_budget_spike = 1 THEN 1
      WHEN bidding_strategy_during_spike = 'TARGET_CPA'
        AND (relative_to_budget_spike = 1 OR relative_to_total_spend_spike = 1) THEN 1
      WHEN bidding_strategy_during_spike = 'SMART' AND relative_to_total_spend_spike = 1 THEN 1
      WHEN bidding_strategy_during_spike = 'FIXED' AND relative_to_total_spend_spike = 1 THEN 1
      ELSE 0
    END) AS spikes_count
  FROM reports_internal.sp_campaigns_spikes_report r
  JOIN accounts a ON a.advertiser_id = r.syndicator_id
  WHERE r.spike_date_utc > a.feature_date - 14
    ${dateFilterSpikes}
  GROUP BY spike_date_utc, advertiser_id, a.feature_date
)
SELECT
  p.description,
  a.advertiser_id,
  ad.data_timestamp_by_request_time,
  a.feature_date,
  ad.avg_depletion_rate,
  ad.mac_avg,
  s.spikes_count,
  bd.amount_of_blocking,
  CASE WHEN bd.amount_of_blocking IS NOT NULL AND bd.amount_of_blocking > 0 THEN 'BLOCKED' ELSE 'NOT BLOCKED' END AS blocking_status
FROM accounts a
JOIN trc.publishers p ON p.id = a.advertiser_id
LEFT JOIN account_data ad ON ad.account_id = a.advertiser_id
LEFT JOIN blocking_data bd ON bd.syndicator_id = ad.account_id
  AND ad.data_timestamp_by_request_time = bd.data_timestamp
LEFT JOIN spikes s ON s.advertiser_id = ad.account_id
  AND ad.data_timestamp_by_request_time = s.spike_date_utc
`;
}

export async function getBurstProtectionData(
  filters?: QueryFilters
): Promise<BurstProtectionRow[]> {
  // Build query with filters in CTEs for performance
  let query = buildFilteredQuery(filters);

  // Add ORDER BY
  query += ` ORDER BY a.advertiser_id, ad.data_timestamp_by_request_time`;

  // Add pagination
  if (filters?.limit) {
    query += ` LIMIT ${filters.limit}`;

    if (filters?.page && filters.page > 1) {
      query += ` OFFSET ${(filters.page - 1) * filters.limit}`;
    }
  }

  console.log('Executing optimized query with filters:', {
    advertiserId: filters?.advertiserId,
    dateRange: `${filters?.startDate} to ${filters?.endDate}`
  });

  const rawData = await executeQuery(query);

  // Validate and transform each row
  return rawData.map(row => {
    try {
      return BurstProtectionRowSchema.parse(row);
    } catch (error) {
      console.error('Row validation error:', error, row);
      throw error;
    }
  });
}

export async function getAdvertisersList(): Promise<{
  id: number;
  description: string;
  feature_date: Date;
}[]> {
  const query = `
    SELECT DISTINCT
      a.advertiser_id as id,
      p.description,
      a.feature_date
    FROM (
      SELECT
        coalesce(n.publisher_id, pc.publisher_id) AS advertiser_id,
        date(pc.update_time) AS feature_date
      FROM trc.publisher_config pc
      LEFT JOIN trc.networks n ON pc.publisher_id = n.network_owner
      WHERE pc.attribute = 'spending-burst-protection:is-enabled-for-publisher'
        AND pc.publisher_id IS NOT NULL
    ) a
    JOIN trc.publishers p ON p.id = a.advertiser_id
    ORDER BY p.description
  `;

  const result = await executeQuery<{ id: number; description: string; feature_date: string | Date }>(query);
  return result.map(row => ({
    id: row.id,
    description: row.description,
    feature_date: new Date(row.feature_date),
  }));
}

export async function getCampaignsList(filters?: {
  advertiserId?: number;
  startDate?: string;
  endDate?: string;
}): Promise<Campaign[]> {
  const startTime = Date.now();

  let query: string;

  if (!filters?.advertiserId) {
    throw new Error('advertiserId is required for getCampaignsList');
  }

  const advertiserCondition = buildFilterCondition('c.syndicator_id', filters.advertiserId);

  if (filters?.startDate && filters?.endDate) {
    const dateRangeCondition = buildDateRangeCondition(
      'a.data_timestamp_by_request_time',
      filters.startDate,
      filters.endDate
    );

    query = `
      SELECT DISTINCT
        c.id,
        c.name,
        c.syndicator_id as advertiser_id,
        c.status
      FROM trc.sp_campaigns c
      WHERE ${advertiserCondition}
        AND EXISTS (
          SELECT 1
          FROM reports.advertiser_dimensions_by_request_time_report_daily a
          WHERE a.campaign_id = c.id
            AND ${buildFilterCondition('a.account_id', filters.advertiserId)}
            AND ${dateRangeCondition}
          LIMIT 1
        )
      ORDER BY c.name
    `;
  } else {
    query = `
      SELECT DISTINCT
        c.id,
        c.name,
        c.syndicator_id as advertiser_id,
        c.status
      FROM trc.sp_campaigns c
      WHERE ${advertiserCondition}
      ORDER BY c.name
    `;
  }

  console.log('Executing optimized campaigns query with filters:', {
    advertiserId: filters.advertiserId,
    dateRange: filters.startDate && filters.endDate
      ? `${filters.startDate} to ${filters.endDate}`
      : 'all campaigns',
    useExistsFilter: !!(filters.startDate && filters.endDate)
  });

  const result = await executeQuery<{
    id: number;
    name: string;
    advertiser_id: number;
    status?: string;
  }>(query);

  const queryTime = Date.now() - startTime;
  console.log(`Campaigns query completed in ${queryTime}ms, returned ${result.length} campaigns`);

  return result.map(row => ({
    id: row.id,
    name: row.name,
    advertiser_id: row.advertiser_id,
    status: row.status,
  }));
}

