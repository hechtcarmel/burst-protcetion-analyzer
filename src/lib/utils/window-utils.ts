import type { WindowRow, CSVWindowRow, DatabaseWindowRow } from '@/types/window';

// Type guards (re-exported from types for convenience)
export function isCSVWindow(row: WindowRow): row is CSVWindowRow {
  return row.source === 'csv';
}

export function isDatabaseWindow(row: WindowRow): row is DatabaseWindowRow {
  return row.source === 'database';
}

// Partition windows by source type
export function partitionWindowsBySource(rows: WindowRow[]): {
  csv: CSVWindowRow[];
  database: DatabaseWindowRow[];
} {
  return rows.reduce(
    (acc, row) => {
      if (isCSVWindow(row)) {
        acc.csv.push(row);
      } else {
        acc.database.push(row);
      }
      return acc;
    },
    { csv: [] as CSVWindowRow[], database: [] as DatabaseWindowRow[] }
  );
}

// Get unique campaign IDs from windows
export function getUniqueCampaignIds(rows: WindowRow[]): number[] {
  const uniqueIds = new Set(rows.map(row => row.campaign_id));
  return Array.from(uniqueIds).sort((a, b) => a - b);
}

// Calculate total duration from windows
export function calculateTotalDuration(rows: WindowRow[]): number {
  return rows.reduce((total, row) => total + row.window_duration_minutes, 0);
}

// Group windows by campaign
export function groupWindowsByCampaign(rows: WindowRow[]): Map<number, WindowRow[]> {
  const grouped = new Map<number, WindowRow[]>();

  for (const row of rows) {
    const existing = grouped.get(row.campaign_id) || [];
    grouped.set(row.campaign_id, [...existing, row]);
  }

  return grouped;
}

// Filter windows by date range
export function filterWindowsByDateRange(
  rows: WindowRow[],
  startDate: Date,
  endDate: Date
): WindowRow[] {
  return rows.filter(row => {
    return row.start_time >= startDate && row.end_time <= endDate;
  });
}

// Filter windows by campaign IDs
export function filterWindowsByCampaigns(
  rows: WindowRow[],
  campaignIds: number[]
): WindowRow[] {
  const campaignIdSet = new Set(campaignIds);
  return rows.filter(row => campaignIdSet.has(row.campaign_id));
}

// Count windows per day
export function countWindowsByDay(rows: WindowRow[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const day = row.start_time.toISOString().split('T')[0];
    counts.set(day, (counts.get(day) || 0) + 1);
  }

  return counts;
}
