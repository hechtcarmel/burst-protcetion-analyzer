'use client';

import { ReactNode } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import ErrorBanner from '@/components/errors/ErrorBanner';
import { CardSkeleton } from '@/components/loading/CardSkeleton';
import { ChartSkeleton } from '@/components/loading/ChartSkeleton';
import type { FilterState } from '@/types/filters';

interface DashboardLayoutProps {
  children: ReactNode;
  filters: FilterState;
  totalAccounts: number;
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onReset: () => void;
  onDateRangeChange: (start: Date, end: Date) => void;
  onAdvertiserIdChange: (id: number | null) => void;
  onCampaignIdChange: (id: number | null) => void;
}

export function DashboardLayout({
  children,
  filters,
  totalAccounts,
  loading,
  error,
  onRefresh,
  onFilterChange,
  onReset,
  onDateRangeChange,
  onAdvertiserIdChange,
  onCampaignIdChange,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-6">
        <DashboardHeader
          dateRange={filters.dateRange}
          totalAccounts={totalAccounts}
          onRefresh={onRefresh}
          loading={loading}
        />

        <DashboardFilters
          filters={filters}
          onFilterChange={onFilterChange}
          onReset={onReset}
          onDateRangeChange={onDateRangeChange}
          onAdvertiserIdChange={onAdvertiserIdChange}
          onCampaignIdChange={onCampaignIdChange}
          loading={loading}
        />

        {error && <ErrorBanner error={error} onRetry={onRefresh} />}

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
            <ChartSkeleton />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
