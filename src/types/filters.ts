export interface DateRange {
  start: Date;
  end: Date;
}

export type SortBy = 'advertiser_id' | 'avg_depletion_rate' | 'spikes_count' | 'feature_date';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  dateRange: DateRange;
  advertiserId: number | null;
  campaignId: number | null;
  sortBy: SortBy;
  sortOrder: SortOrder;
  page?: number;
  limit?: number;
}
