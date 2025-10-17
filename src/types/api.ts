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
