import { useMemo } from 'react';
import type { SortOrder } from '@/types/filters';

export function useTableSort<T extends Record<string, unknown>>(
  data: T[],
  sortKey?: string,
  sortOrder?: SortOrder
): T[] {
  return useMemo(() => {
    if (!sortKey || !sortOrder) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey as keyof T];
      const bVal = b[sortKey as keyof T];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortOrder]);
}
