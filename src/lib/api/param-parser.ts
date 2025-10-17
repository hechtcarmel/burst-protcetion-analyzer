import { NextRequest } from 'next/server';
import { ZodSchema } from 'zod';

export function parseQueryParams<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): T {
  const searchParams = request.nextUrl.searchParams;

  const rawParams: Record<string, unknown> = {};
  searchParams.forEach((value, key) => {
    if (key === 'advertiserId' || key === 'campaignId') {
      rawParams[key] = value ? Number(value) : null;
    } else if (key === 'page' || key === 'limit') {
      rawParams[key] = value ? Number(value) : undefined;
    } else {
      rawParams[key] = value || undefined;
    }
  });

  return schema.parse(rawParams);
}

export function extractNumberParam(
  searchParams: URLSearchParams,
  key: string
): number | null {
  const value = searchParams.get(key);
  return value ? Number(value) : null;
}

export function extractBooleanParam(
  searchParams: URLSearchParams,
  key: string
): boolean {
  return searchParams.get(key) === 'true';
}

export function extractStringParam(
  searchParams: URLSearchParams,
  key: string
): string | undefined {
  return searchParams.get(key) || undefined;
}
