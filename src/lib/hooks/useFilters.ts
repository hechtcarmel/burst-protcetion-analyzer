import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import type { FilterState } from '@/types/filters';
import { serializeFiltersToURL, deserializeFiltersFromURL } from '@/lib/utils/url-params';

const DEFAULT_FILTERS: FilterState = {
  dateRange: {
    start: startOfDay(subDays(new Date(), 7)),
    end: endOfDay(new Date()),
  },
  advertiserId: null,
  campaignId: null,
  sortBy: 'advertiser_id',
  sortOrder: 'asc',
  page: 1,
  limit: 1000,
};

export function useFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTabState] = useState('overview');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [shouldSyncURL, setShouldSyncURL] = useState(false);

  useEffect(() => {
    if (!isInitialized && searchParams) {
      const { filters: urlFilters, activeTab: urlTab } = deserializeFiltersFromURL(
        searchParams,
        DEFAULT_FILTERS
      );
      setFilters(urlFilters);
      setActiveTabState(urlTab);
      setIsInitialized(true);
      // Enable URL sync after initial load is complete with a longer delay to ensure filters are applied
      setTimeout(() => setShouldSyncURL(true), 100);
    }
  }, [searchParams, isInitialized]);

  const updateURL = useCallback((newFilters: FilterState, newTab: string) => {
    const params = serializeFiltersToURL(newFilters, newTab);
    const urlParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        urlParams.set(key, value);
      }
    });

    const newURL = `?${urlParams.toString()}`;
    router.replace(newURL, { scroll: false });
  }, [router]);

  // Sync filters and activeTab to URL (but not during initial load)
  useEffect(() => {
    if (shouldSyncURL && isInitialized) {
      updateURL(filters, activeTab);
    }
  }, [filters, activeTab, shouldSyncURL, isInitialized, updateURL]);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setActiveTabState('overview');
  }, []);

  const setDateRange = useCallback((start: Date, end: Date) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { start, end },
    }));
  }, []);

  const setAdvertiserId = useCallback((id: number | null) => {
    setFilters(prev => ({
      ...prev,
      advertiserId: id,
      campaignId: null,
    }));
  }, []);

  const setCampaignId = useCallback((id: number | null) => {
    setFilters(prev => ({
      ...prev,
      campaignId: id,
    }));
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
  }, []);

  return {
    filters,
    activeTab,
    updateFilters,
    resetFilters,
    setDateRange,
    setAdvertiserId,
    setCampaignId,
    setActiveTab,
  };
}
