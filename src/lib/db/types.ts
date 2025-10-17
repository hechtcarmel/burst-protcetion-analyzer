import type { z } from 'zod';
import type {
  BurstProtectionRowSchema,
  BurstProtectionDataSchema,
  FilterParamsSchema,
  AdvertiserSchema,
  DateRangeSchema,
  CampaignSchema,
} from './schema';

// Inferred types from schemas
export type BurstProtectionRow = z.infer<typeof BurstProtectionRowSchema>;
export type BurstProtectionData = z.infer<typeof BurstProtectionDataSchema>;
export type QueryFilters = z.infer<typeof FilterParamsSchema>;
export type Advertiser = z.infer<typeof AdvertiserSchema>;
export type DateRangeData = z.infer<typeof DateRangeSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;

// Extended types for internal use
export interface EnrichedBurstProtectionRow extends BurstProtectionRow {
  days_since_feature: number;
  is_pre_feature: boolean;
  depletion_rate_category: 'low' | 'medium' | 'high' | 'critical';
}

export interface QueryFiltersInternal extends QueryFilters {
  sortBy?: 'advertiser_id' | 'avg_depletion_rate' | 'spikes_count' | 'feature_date';
  sortOrder?: 'asc' | 'desc';
}
