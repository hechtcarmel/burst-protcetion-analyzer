import { NextRequest } from 'next/server';
import { getAdvertisersList } from '@/lib/db/queries';
import { AdvertisersListSchema } from '@/lib/db/schema';
import { handleApiError } from '@/lib/api/error-handler';
import { checkCache, setCache, createCachedResponse } from '@/lib/api/cache-handler';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const cacheOptions = {
      keyPrefix: 'bp:advertisers',
      keyParams: {},
      ttl: 3600,
    };

    const cachedAdvertisers = checkCache<{ advertisers: unknown[] }>(request, cacheOptions);

    if (cachedAdvertisers) {
      return createCachedResponse(cachedAdvertisers, {
        cached: true,
        query_time_ms: 0,
        cache_age_ms: Date.now() - startTime,
        cacheControl: 'public, s-maxage=3600, stale-while-revalidate=7200',
      });
    }

    const advertisers = await getAdvertisersList();
    const validated = AdvertisersListSchema.parse(advertisers);

    const responseData = { advertisers: validated };

    setCache(responseData, cacheOptions);

    return createCachedResponse(responseData, {
      cached: false,
      query_time_ms: Date.now() - startTime,
      cacheControl: 'public, s-maxage=3600, stale-while-revalidate=7200',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
