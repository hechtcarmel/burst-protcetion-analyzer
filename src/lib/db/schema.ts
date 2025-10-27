import { z } from 'zod';

// Row schema
export const BurstProtectionRowSchema = z.object({
  description: z.string(),
  advertiser_id: z.number().int().positive(),
  data_timestamp_by_request_time: z.coerce.date(),
  feature_date: z.coerce.date(),
  avg_depletion_rate: z.number().nullable(),
  mac_avg: z.number().nullable(),
  spikes_count: z.number().int().nonnegative().nullable(),
  amount_of_blocking: z.number().nonnegative().nullable(),
  blocking_status: z.enum(['BLOCKED', 'NOT BLOCKED']),
});

// Array schema
export const BurstProtectionDataSchema = z.array(BurstProtectionRowSchema);

// API request schemas
export const FilterParamsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  advertiserId: z.number().int().positive().nullable().optional(),
  campaignId: z.number().int().positive().nullable().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(10000).optional(),
});

// Advertiser schema
export const AdvertiserSchema = z.object({
  id: z.number().int().positive(),
  description: z.string(),
  feature_date: z.coerce.date(),
});

export const AdvertisersListSchema = z.array(AdvertiserSchema);

// Campaign schema
export const CampaignSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  advertiser_id: z.number().int().positive(),
  status: z.string().optional(),
});

export const CampaignsListSchema = z.array(CampaignSchema);

// Date range schema
export const DateRangeSchema = z.object({
  min_date: z.coerce.date(),
  max_date: z.coerce.date(),
});

// Windows API request schema
export const WindowsFilterSchema = z.object({
  advertiserId: z.number().int().positive().optional(),
  campaignId: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Vertica window row schema (raw data from database)
export const VerticaWindowRowSchema = z.object({
  syndicator_id: z.number().int().positive(),
  campaign_id: z.number().int().positive(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  avg_expected_hourly_spend: z.number().nullable(),
  avg_current_period_spend: z.number().nullable(),
});

export const VerticaWindowDataSchema = z.array(VerticaWindowRowSchema);
