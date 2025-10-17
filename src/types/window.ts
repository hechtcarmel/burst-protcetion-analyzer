export interface WindowRow {
  campaign_id: number;
  start_time: Date;
  end_time: Date;
  avg_expected_hourly_spend: number | null;
  avg_current_period_spend: number | null;
  window_duration_minutes: number;
}

export interface WindowMetrics {
  date: Date;
  windowCount: number;
  totalDuration: number;
  campaigns: number[];
}

export interface CampaignWindow {
  campaign_id: number;
  campaign_name?: string;
  windows: WindowRow[];
  totalWindows: number;
  totalDuration: number;
}
