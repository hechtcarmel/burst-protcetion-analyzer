import { NextRequest } from 'next/server';
import { getCampaignsList } from '@/lib/db/queries';
import { CampaignsListSchema } from '@/lib/db/schema';
import { handleApiError } from '@/lib/api/error-handler';
import { checkCache, setCache, createCachedResponse } from '@/lib/api/cache-handler';
import { z } from 'zod';

export const runtime = 'nodejs';
export const revalidate = 300;

const QueryParamsSchema = z.object({
  advertiserId: z.string().nullable().transform(val => val ? parseInt(val, 10) : undefined),
  startDate: z.string().nullable().transform(val => val || undefined),
  endDate: z.string().nullable().transform(val => val || undefined),
});

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    const params = QueryParamsSchema.parse({
      advertiserId: searchParams.get('advertiserId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    const cacheOptions = {
      keyPrefix: 'bp:campaigns',
      keyParams: {
        advertiserId: params.advertiserId,
        startDate: params.startDate,
        endDate: params.endDate,
      },
      ttl: 300,
    };

    const cachedCampaigns = checkCache<{
      campaigns: unknown[];
      count: number;
      filters: Record<string, unknown>;
    }>(request, cacheOptions);

    if (cachedCampaigns) {
      return createCachedResponse(cachedCampaigns, {
        cached: true,
        query_time_ms: 0,
        cache_age_ms: Date.now() - startTime,
      });
    }

    const campaigns = await getCampaignsList({
      advertiserId: params.advertiserId,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    const validated = CampaignsListSchema.parse(campaigns);

    const responseData = {
      campaigns: validated,
      count: validated.length,
      filters: {
        advertiserId: params.advertiserId ?? null,
        startDate: params.startDate ?? null,
        endDate: params.endDate ?? null,
      },
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
