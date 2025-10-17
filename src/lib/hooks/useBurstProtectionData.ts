import { useQuery } from '@tanstack/react-query';
import type { BurstProtectionData } from '@/lib/db/types';
import type { FilterState } from '@/types/filters';

interface APIResponse {
  data: BurstProtectionData;
  metadata: {
    total_rows: number;
    query_time_ms: number;
    filters_applied: Record<string, unknown>;
  };
  success: boolean;
}

async function fetchBurstProtectionData(
  filters: FilterState
): Promise<APIResponse> {
  const params = new URLSearchParams();

  if (filters.dateRange.start) {
    params.append('startDate', filters.dateRange.start.toISOString());
  }
  if (filters.dateRange.end) {
    params.append('endDate', filters.dateRange.end.toISOString());
  }
  if (filters.advertiserId !== null) {
    params.append('advertiserId', filters.advertiserId.toString());
  }
  if (filters.limit) {
    params.append('limit', filters.limit.toString());
  }
  if (filters.page) {
    params.append('page', filters.page.toString());
  }

  const response = await fetch(`/api/burst-protection?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export function useBurstProtectionData(filters: FilterState) {
  return useQuery({
    queryKey: ['burst-protection-data', filters],
    queryFn: () => fetchBurstProtectionData(filters),
    enabled: !!filters.dateRange.start && !!filters.dateRange.end,
  });
}
