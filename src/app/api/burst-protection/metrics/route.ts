import { NextRequest } from 'next/server';
import { getBurstProtectionData } from '@/lib/db/queries';
import { FilterParamsSchema } from '@/lib/db/schema';
import { calculateMetrics } from '@/lib/analytics/calculators';
import { handleApiError } from '@/lib/api/error-handler';
import { checkCache, setCache, createCachedResponse } from '@/lib/api/cache-handler';
import { parseQueryParams } from '@/lib/api/param-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const validatedParams = parseQueryParams(request, FilterParamsSchema);

    const cacheOptions = {
      keyPrefix: 'bp:metrics',
      keyParams: {
        startDate: validatedParams.startDate,
        endDate: validatedParams.endDate,
        advertiserId: validatedParams.advertiserId,
      },
      ttl: 300,
    };

    const cachedMetrics = checkCache<{ metrics: unknown }>(request, cacheOptions);

    if (cachedMetrics) {
      return createCachedResponse(cachedMetrics, {
        cached: true,
        query_time_ms: 0,
        cache_age_ms: Date.now() - startTime,
      });
    }

    const data = await getBurstProtectionData(validatedParams);
    const metrics = calculateMetrics(data);

    const responseData = { metrics };

    setCache(responseData, cacheOptions);

    return createCachedResponse(responseData, {
      cached: false,
      query_time_ms: Date.now() - startTime,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
