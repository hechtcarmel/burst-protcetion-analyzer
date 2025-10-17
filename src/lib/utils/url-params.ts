import { format, parse, isValid, startOfDay, endOfDay } from 'date-fns';
import type { FilterState, SortBy, SortOrder } from '@/types/filters';

export interface URLParams {
  tab?: string;
  startDate?: string;
  endDate?: string;
  advertiser?: string;
  campaign?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function serializeFiltersToURL(filters: FilterState, activeTab?: string): URLParams {
  const params: URLParams = {};

  if (activeTab) {
    params.tab = activeTab;
  }

  if (filters.dateRange.start) {
    params.startDate = format(filters.dateRange.start, 'yyyy-MM-dd');
  }

  if (filters.dateRange.end) {
    params.endDate = format(filters.dateRange.end, 'yyyy-MM-dd');
  }

  if (filters.advertiserId !== null) {
    params.advertiser = String(filters.advertiserId);
  }

  if (filters.campaignId !== null) {
    params.campaign = String(filters.campaignId);
  }

  if (filters.sortBy !== 'advertiser_id') {
    params.sortBy = filters.sortBy;
  }

  if (filters.sortOrder !== 'asc') {
    params.sortOrder = filters.sortOrder;
  }

  return params;
}

export function deserializeFiltersFromURL(
  searchParams: URLSearchParams,
  defaults: FilterState
): { filters: FilterState; activeTab: string } {
  const filters: FilterState = { ...defaults };
  let activeTab = 'overview';

  // Parse tab
  const tabParam = searchParams.get('tab');
  if (tabParam) {
    activeTab = tabParam;
  }

  // Parse dates
  const startDateParam = searchParams.get('startDate');
  if (startDateParam) {
    const parsedStart = parse(startDateParam, 'yyyy-MM-dd', new Date());
    if (isValid(parsedStart)) {
      filters.dateRange.start = startOfDay(parsedStart);
    }
  }

  const endDateParam = searchParams.get('endDate');
  if (endDateParam) {
    const parsedEnd = parse(endDateParam, 'yyyy-MM-dd', new Date());
    if (isValid(parsedEnd)) {
      filters.dateRange.end = endOfDay(parsedEnd);
    }
  }

  // Parse advertiser ID
  const advertiserParam = searchParams.get('advertiser');
  if (advertiserParam) {
    const id = parseInt(advertiserParam, 10);
    if (!isNaN(id)) {
      filters.advertiserId = id;
    }
  }

  // Parse campaign ID
  const campaignParam = searchParams.get('campaign');
  if (campaignParam) {
    const id = parseInt(campaignParam, 10);
    if (!isNaN(id)) {
      filters.campaignId = id;
    }
  }

  // Parse sort settings
  const sortByParam = searchParams.get('sortBy');
  if (sortByParam) {
    filters.sortBy = sortByParam as SortBy;
  }

  const sortOrderParam = searchParams.get('sortOrder');
  if (sortOrderParam && ['asc', 'desc'].includes(sortOrderParam)) {
    filters.sortOrder = sortOrderParam as SortOrder;
  }

  return { filters, activeTab };
}
