import { NextRequest } from 'next/server';
import { getBurstProtectionData } from '@/lib/db/queries';
import { FilterParamsSchema } from '@/lib/db/schema';
import { handleApiError } from '@/lib/api/error-handler';
import { checkCache, setCache, createCachedResponse } from '@/lib/api/cache-handler';
import { parseQueryParams } from '@/lib/api/param-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('=== Burst Protection API Called ===');

    const validatedParams = parseQueryParams(request, FilterParamsSchema);
    console.log('Validated params:', validatedParams);

    const cacheOptions = {
      keyPrefix: 'bp:data',
      keyParams: {
        startDate: validatedParams.startDate,
        endDate: validatedParams.endDate,
        advertiserId: validatedParams.advertiserId,
        campaignId: validatedParams.campaignId,
        page: validatedParams.page,
        limit: validatedParams.limit,
      },
      ttl: 300,
    };

    const cachedData = checkCache<{
      data: unknown[];
      metadata: unknown;
    }>(request, cacheOptions);

    if (cachedData) {
      return createCachedResponse(cachedData, {
        cached: true,
        query_time_ms: 0,
        cache_age_ms: Date.now() - startTime,
      });
    }

    console.log('Executing Vertica query...');
    const data = await getBurstProtectionData(validatedParams);
    console.log('Query returned rows:', data.length);

    const metadata = {
      total_rows: data.length,
      query_time_ms: Date.now() - startTime,
      filters_applied: {
        date_range: validatedParams.startDate && validatedParams.endDate,
        advertiser: !!validatedParams.advertiserId,
        campaign: !!validatedParams.campaignId,
      },
    };

    const responseData = {
      data,
      metadata,
    };

    setCache(responseData, cacheOptions);

    return createCachedResponse(responseData, {
      cached: false,
      query_time_ms: Date.now() - startTime,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
