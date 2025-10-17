import { useQuery } from '@tanstack/react-query';
import type { Advertiser } from '@/lib/db/types';

interface AdvertisersAPIResponse {
  advertisers: Advertiser[];
  success: boolean;
}

async function fetchAdvertisers(): Promise<AdvertisersAPIResponse> {
  const response = await fetch('/api/burst-protection/advertisers');

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export function useAdvertisers() {
  return useQuery({
    queryKey: ['advertisers'],
    queryFn: fetchAdvertisers,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
