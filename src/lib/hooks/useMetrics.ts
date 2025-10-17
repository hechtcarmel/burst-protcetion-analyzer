import { useQuery } from '@tanstack/react-query';
import type { DashboardMetrics } from '@/lib/analytics/calculators';
import type { FilterState } from '@/types/filters';

interface MetricsAPIResponse {
  metrics: DashboardMetrics;
  success: boolean;
}

async function fetchMetrics(filters: FilterState): Promise<MetricsAPIResponse> {
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

  const response = await fetch(`/api/burst-protection/metrics?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export function useMetrics(filters: FilterState) {
  return useQuery({
    queryKey: ['burst-protection-metrics', filters],
    queryFn: () => fetchMetrics(filters),
    enabled: !!filters.dateRange.start && !!filters.dateRange.end,
  });
}
