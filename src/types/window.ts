// Base window data (common fields)
interface BaseWindowRow {
  campaign_id: number;
  start_time: Date;
  end_time: Date;
  avg_expected_hourly_spend: number | null;
  avg_current_period_spend: number | null;
  window_duration_minutes: number;
}

// CSV source (from uploaded file)
export interface CSVWindowRow extends BaseWindowRow {
  source: 'csv';
}

// Database source (from Vertica)
export interface DatabaseWindowRow extends BaseWindowRow {
  source: 'database';
  syndicator_id: number;
}

// Discriminated union for window rows
export type WindowRow = CSVWindowRow | DatabaseWindowRow;

// Type guards for runtime type narrowing
export function isCSVWindow(row: WindowRow): row is CSVWindowRow {
  return row.source === 'csv';
}

export function isDatabaseWindow(row: WindowRow): row is DatabaseWindowRow {
  return row.source === 'database';
}

// Window data state (discriminated union for type-safe state management)
export type WindowDataState =
  | { status: 'idle'; source: null; data: [] }
  | { status: 'loading'; source: 'csv' | 'database'; data: [] }
  | { status: 'error'; source: 'csv' | 'database'; error: string; data: [] }
  | { status: 'success'; source: 'csv'; data: CSVWindowRow[] }
  | { status: 'success'; source: 'database'; data: DatabaseWindowRow[] };

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
