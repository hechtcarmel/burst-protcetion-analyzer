'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import type { DateRange } from '@/types/filters';

interface DashboardHeaderProps {
  dateRange: DateRange;
  totalAccounts: number;
  onRefresh: () => void;
  loading?: boolean;
}

export default function DashboardHeader({
  dateRange,
  totalAccounts,
  onRefresh,
  loading,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slide-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Burst Protection Analysis
        </h1>
        <p className="text-muted-foreground mt-1 animate-fade-in">
          {format(dateRange.start, 'MMM dd, yyyy')} - {format(dateRange.end, 'MMM dd, yyyy')} •{' '}
          {totalAccounts} accounts
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
}
