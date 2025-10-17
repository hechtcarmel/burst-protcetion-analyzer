'use client';

import DateRangePicker from '@/components/filters/DateRangePicker';
import AdvertiserSelect from '@/components/filters/AdvertiserSelect';
import CampaignSelect from '@/components/filters/CampaignSelect';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import type { FilterState } from '@/types/filters';

interface DashboardFiltersProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onReset: () => void;
  onDateRangeChange: (start: Date, end: Date) => void;
  onAdvertiserIdChange: (id: number | null) => void;
  onCampaignIdChange: (id: number | null) => void;
  loading?: boolean;
}

export default function DashboardFilters({
  filters,
  onReset,
  onDateRangeChange,
  onAdvertiserIdChange,
  onCampaignIdChange,
  loading,
}: DashboardFiltersProps) {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-6 items-end">
          {/* Date Range Filter */}
          <div className="flex flex-col gap-2">
            <label htmlFor="date-range" className="text-sm font-medium text-foreground">
              Date Range
            </label>
            <DateRangePicker
              value={filters.dateRange}
              onChange={(range) => onDateRangeChange(range.start, range.end)}
            />
          </div>

          {/* Advertiser Filter */}
          <div className="flex flex-col gap-2">
            <label htmlFor="advertiser-select" className="text-sm font-medium text-foreground">
              Advertiser
            </label>
            <AdvertiserSelect
              value={filters.advertiserId}
              onChange={onAdvertiserIdChange}
            />
          </div>

          {/* Campaign Filter */}
          <div className="flex flex-col gap-2">
            <label htmlFor="campaign-select" className="text-sm font-medium text-foreground">
              Campaign
            </label>
            <CampaignSelect
              value={filters.campaignId}
              onChange={onCampaignIdChange}
              advertiserId={filters.advertiserId}
              dateRange={filters.dateRange}
            />
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="default"
            onClick={onReset}
            disabled={loading}
            title="Reset all filters"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
