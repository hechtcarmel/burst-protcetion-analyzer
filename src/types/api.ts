export interface APIResponse<T> {
  data: T;
  metadata?: {
    total_rows: number;
    query_time_ms: number;
    filters_applied: Record<string, unknown>;
  };
  success: boolean;
}

export interface APIError {
  error: string;
  message?: string;
  details?: unknown;
  success: false;
}

// Windows API specific types
export interface WindowsFilterParams {
  advertiserId?: number;
  campaignId?: number;
  startDate?: string;
  endDate?: string;
}

export interface WindowsMetadata {
  total_windows: number;
  query_time_ms: number;
  campaign_count: number;
  date_range: {
    start: string;
    end: string;
  } | null;
}
