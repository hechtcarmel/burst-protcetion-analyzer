import { useQuery } from '@tanstack/react-query';
import type { DatabaseWindowRow } from '@/types/window';
import type { WindowsMetadata } from '@/types/api';

interface UseWindowsFromVerticaParams {
  advertiserId: number | null;
  campaignId?: number | null;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

interface WindowsApiResponse {
  data: DatabaseWindowRow[];
  metadata: WindowsMetadata;
}

interface UseWindowsFromVerticaReturn {
  data: DatabaseWindowRow[] | undefined;
  metadata: WindowsMetadata | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

async function fetchWindowsFromVertica(
  params: UseWindowsFromVerticaParams
): Promise<WindowsApiResponse> {
  const queryParams = new URLSearchParams();

  if (params.advertiserId) {
    queryParams.append('advertiserId', params.advertiserId.toString());
  }
  if (params.campaignId) {
    queryParams.append('campaignId', params.campaignId.toString());
  }
  if (params.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    queryParams.append('endDate', params.endDate);
  }

  const url = `/api/burst-protection/windows?${queryParams.toString()}`;
  console.log('Fetching windows from:', url);

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch windows' }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useWindowsFromVertica(
  params: UseWindowsFromVerticaParams
): UseWindowsFromVerticaReturn {
  const { advertiserId, campaignId, startDate, endDate, enabled = true } = params;

  const query = useQuery({
    queryKey: ['windows', 'vertica', { advertiserId, campaignId, startDate, endDate }],
    queryFn: () => fetchWindowsFromVertica(params),
    enabled: enabled && advertiserId !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    data: query.data?.data,
    metadata: query.data?.metadata,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
