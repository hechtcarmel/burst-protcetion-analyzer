import type { CSVWindowRow } from '@/types/window';

export function parseWindowCSV(csvContent: string): CSVWindowRow[] {
  const lines = csvContent.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV file is empty or missing data');
  }

  const header = lines[0].toLowerCase().split(',').map(h => h.trim());

  const requiredColumns = [
    'campaign_id',
    'start_time',
    'end_time',
  ];

  const missingColumns = requiredColumns.filter(col => !header.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`CSV missing required columns: ${missingColumns.join(', ')}`);
  }

  const campaignIdIdx = header.indexOf('campaign_id');
  const startTimeIdx = header.indexOf('start_time');
  const endTimeIdx = header.indexOf('end_time');
  const avgExpectedIdx = header.indexOf('avg_expected_hourly_spend');
  const avgCurrentIdx = header.indexOf('avg_current_period_spend');
  const durationIdx = header.indexOf('window_duration_minutes');

  const rows: CSVWindowRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());

    try {
      const startTime = new Date(values[startTimeIdx]);
      const endTime = new Date(values[endTimeIdx]);

      if (isNaN(startTime.getTime())) {
        throw new Error(`Invalid start_time: ${values[startTimeIdx]}`);
      }
      if (isNaN(endTime.getTime())) {
        throw new Error(`Invalid end_time: ${values[endTimeIdx]}`);
      }

      const durationMs = endTime.getTime() - startTime.getTime();
      const calculatedDuration = durationMs / (1000 * 60);

      const row: CSVWindowRow = {
        source: 'csv' as const,
        campaign_id: parseInt(values[campaignIdIdx], 10),
        start_time: startTime,
        end_time: endTime,
        avg_expected_hourly_spend: avgExpectedIdx >= 0 && values[avgExpectedIdx] ? parseFloat(values[avgExpectedIdx]) : null,
        avg_current_period_spend: avgCurrentIdx >= 0 && values[avgCurrentIdx] ? parseFloat(values[avgCurrentIdx]) : null,
        window_duration_minutes: durationIdx >= 0 && values[durationIdx] ? parseFloat(values[durationIdx]) : calculatedDuration,
      };

      if (isNaN(row.campaign_id)) {
        throw new Error(`Invalid campaign_id: ${values[campaignIdIdx]}`);
      }

      rows.push(row);
    } catch (error) {
      console.error(`Error parsing line ${i + 1}:`, line, error);
      throw new Error(`CSV parse error on line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return rows;
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsText(file);
  });
}
