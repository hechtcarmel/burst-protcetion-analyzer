import { NextRequest } from 'next/server';
import { getBlockingWindows } from '@/lib/db/queries';
import { WindowsFilterSchema } from '@/lib/db/schema';
import { handleApiError } from '@/lib/api/error-handler';
import { checkCache, setCache, createCachedResponse } from '@/lib/api/cache-handler';
import { parseQueryParams } from '@/lib/api/param-parser';
import type { DatabaseWindowRow } from '@/types/window';
import type { WindowsMetadata } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('=== Blocking Windows API Called ===');

    const validatedParams = parseQueryParams(request, WindowsFilterSchema);
    console.log('Validated params:', validatedParams);

    const cacheOptions = {
      keyPrefix: 'bp:windows',
      keyParams: {
        advertiserId: validatedParams.advertiserId,
        campaignId: validatedParams.campaignId,
        startDate: validatedParams.startDate,
        endDate: validatedParams.endDate,
      },
      ttl: 300,
    };

    const cachedData = checkCache<{
      data: DatabaseWindowRow[];
      metadata: WindowsMetadata;
    }>(request, cacheOptions);

    if (cachedData) {
      return createCachedResponse(cachedData, {
        cached: true,
        query_time_ms: 0,
        cache_age_ms: Date.now() - startTime,
      });
    }

    console.log('Executing Vertica query for blocking windows...');
    const rawData = await getBlockingWindows(validatedParams);
    console.log('Query returned windows:', rawData.length);

    // Transform to DatabaseWindowRow with source tag
    const data: DatabaseWindowRow[] = rawData.map(row => ({
      source: 'database' as const,
      campaign_id: row.campaign_id,
      start_time: row.start_time,
      end_time: row.end_time,
      avg_expected_hourly_spend: row.avg_expected_hourly_spend,
      avg_current_period_spend: row.avg_current_period_spend,
      window_duration_minutes: row.window_duration_minutes,
      syndicator_id: row.syndicator_id,
    }));

    // Count unique campaigns
    const uniqueCampaigns = new Set(data.map(w => w.campaign_id));

    const metadata: WindowsMetadata = {
      total_windows: data.length,
      query_time_ms: Date.now() - startTime,
      campaign_count: uniqueCampaigns.size,
      date_range: validatedParams.startDate && validatedParams.endDate
        ? {
            start: validatedParams.startDate,
            end: validatedParams.endDate,
          }
        : null,
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
