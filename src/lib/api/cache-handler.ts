import { NextRequest, NextResponse } from 'next/server';
import { cacheManager, generateCacheKey } from '@/lib/cache';

export interface CacheOptions {
  ttl?: number;
  keyPrefix: string;
  keyParams: Record<string, unknown>;
}

export function checkCache<T>(
  request: NextRequest,
  options: CacheOptions
): T | null {
  const searchParams = request.nextUrl.searchParams;
  const noCache = searchParams.get('nocache') === 'true';

  if (noCache) {
    return null;
  }

  const cacheKey = generateCacheKey(options.keyPrefix, options.keyParams);
  const cached = cacheManager.get<T>(cacheKey);
  return cached !== undefined ? cached : null;
}

export function setCache<T>(
  data: T,
  options: CacheOptions
): void {
  const cacheKey = generateCacheKey(options.keyPrefix, options.keyParams);
  const ttl = options.ttl ?? 300;
  cacheManager.set(cacheKey, data, ttl);
}

export function createCachedResponse<T>(
  data: T,
  options: {
    cached: boolean;
    query_time_ms: number;
    cache_age_ms?: number;
    cacheControl?: string;
  }
): NextResponse {
  return NextResponse.json(
    {
      ...data,
      success: true,
      cached: options.cached,
      ...(options.cached && { cache_age_ms: options.cache_age_ms }),
      ...(!options.cached && { query_time_ms: options.query_time_ms }),
    },
    {
      headers: {
        'Cache-Control': options.cacheControl ?? 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': options.cached ? 'HIT' : 'MISS',
      },
    }
  );
}
