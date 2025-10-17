import { useQuery } from '@tanstack/react-query';
import type { Campaign } from '@/lib/db/types';

interface CampaignsAPIResponse {
  campaigns: Campaign[];
  count: number;
  filters: {
    advertiserId: number | null;
    startDate: string | null;
    endDate: string | null;
  };
  success: boolean;
}

async function fetchCampaigns(filters: {
  advertiserId?: number | null;
  startDate?: Date;
  endDate?: Date;
}): Promise<CampaignsAPIResponse> {
  const params = new URLSearchParams();

  if (filters.advertiserId) {
    params.set('advertiserId', filters.advertiserId.toString());
  }

  if (filters.startDate && filters.endDate) {
    params.set('startDate', filters.startDate.toISOString().split('T')[0]);
    params.set('endDate', filters.endDate.toISOString().split('T')[0]);
  }

  const response = await fetch(`/api/burst-protection/campaigns?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export function useCampaigns(filters: {
  advertiserId?: number | null;
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: ['campaigns', filters.advertiserId, filters.startDate, filters.endDate],
    queryFn: () => fetchCampaigns(filters),
    enabled: !!filters.advertiserId && !!(filters.startDate && filters.endDate),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
