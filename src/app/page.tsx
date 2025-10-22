'use client';

import { Suspense, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useFilters } from '@/lib/hooks/useFilters';
import { useMetrics } from '@/lib/hooks/useMetrics';
import { useBurstProtectionData } from '@/lib/hooks/useBurstProtectionData';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import { useWindowsFromVertica } from '@/lib/hooks/useWindowsFromVertica';
import { useWindows } from '@/lib/contexts/WindowContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import MetricsCards from '@/components/dashboard/MetricsCards';
import ChartTabs from '@/components/dashboard/ChartTabs';
import DataTable from '@/components/dashboard/DataTable';
import { CardSkeleton } from '@/components/loading/CardSkeleton';
import { ChartSkeleton } from '@/components/loading/ChartSkeleton';
import type { SortBy } from '@/types/filters';

function DashboardContent() {
  const {
    filters,
    activeTab,
    updateFilters,
    resetFilters,
    setDateRange,
    setAdvertiserId,
    setCampaignId,
    setActiveTab,
  } = useFilters();

  const {
    data: rawData,
    isLoading: dataLoading,
    error: dataError,
    refetch: refetchData,
  } = useBurstProtectionData(filters);

  const {
    data: metricsData,
    isLoading: metricsLoading,
    error: metricsError,
  } = useMetrics(filters);

  useCampaigns({
    advertiserId: filters.advertiserId,
    startDate: filters.dateRange.start,
    endDate: filters.dateRange.end,
  });

  // Fetch windows from Vertica (non-blocking, async)
  const {
    loadFromDatabase,
    setDatabaseLoading,
    setDatabaseError,
  } = useWindows();

  const {
    data: verticaWindows,
    isLoading: windowsLoading,
    isError: windowsError,
    error: windowsErrorObj,
  } = useWindowsFromVertica({
    advertiserId: filters.advertiserId,
    campaignId: filters.campaignId ?? undefined,
    startDate: filters.dateRange.start.toISOString().split('T')[0],
    endDate: filters.dateRange.end.toISOString().split('T')[0],
  });

  // Update windows context when Vertica data arrives
  useEffect(() => {
    if (windowsLoading) {
      setDatabaseLoading();
    } else if (windowsError && windowsErrorObj) {
      setDatabaseError(windowsErrorObj.message);
    } else if (verticaWindows) {
      loadFromDatabase(verticaWindows);
    }
  }, [windowsLoading, windowsError, windowsErrorObj, verticaWindows, loadFromDatabase, setDatabaseLoading, setDatabaseError]);

  const isLoading = dataLoading || metricsLoading;
  const error = dataError || metricsError;

  const handleSort = (key: string) => {
    updateFilters({
      sortBy: key as SortBy,
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <DashboardLayout
      filters={filters}
      totalAccounts={metricsData?.metrics.kpis.totalAccounts || 0}
      loading={isLoading}
      error={error as Error | null}
      onRefresh={() => refetchData()}
      onFilterChange={updateFilters}
      onReset={resetFilters}
      onDateRangeChange={setDateRange}
      onAdvertiserIdChange={setAdvertiserId}
      onCampaignIdChange={setCampaignId}
    >
      <MetricsCards
        metrics={metricsData?.metrics.kpis}
        loading={metricsLoading}
      />

      <ChartTabs
        dailyMetrics={metricsData?.metrics.dailyMetrics || []}
        rawData={rawData?.data || []}
        loading={isLoading}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filters={{
          startDate: filters.dateRange.start.toISOString().split('T')[0],
          endDate: filters.dateRange.end.toISOString().split('T')[0],
          campaignId: filters.campaignId,
          advertiserId: filters.advertiserId,
        }}
      />

      <DataTable
        data={rawData?.data || []}
        loading={dataLoading}
        onSort={handleSort}
        sortKey={filters.sortBy}
        sortOrder={filters.sortOrder}
      />
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={
        <div className="min-h-screen bg-background">
          <div className="container mx-auto py-8 px-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
            <ChartSkeleton />
          </div>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </QueryClientProvider>
  );
}
