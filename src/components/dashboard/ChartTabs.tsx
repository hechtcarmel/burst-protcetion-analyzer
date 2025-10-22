'use client';

import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import DepletionRateChart from '@/components/charts/DepletionRateChart';
import SpikeCountChart from '@/components/charts/SpikeCountChart';
import WindowTimelineChart from '@/components/charts/WindowTimelineChart';
import WindowDataControls from './WindowDataControls';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import { useWindowData } from '@/lib/hooks/useWindowData';
import { useWindows } from '@/lib/contexts/WindowContext';
import type { DailyMetrics } from '@/lib/analytics/calculators';
import type { BurstProtectionRow } from '@/lib/db/types';

interface ChartTabsProps {
  dailyMetrics: DailyMetrics[];
  rawData: BurstProtectionRow[];
  loading?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  filters?: {
    startDate?: string;
    endDate?: string;
    campaignId?: number | null;
    advertiserId?: number | null;
  };
}

export default function ChartTabs({
  dailyMetrics,
  rawData,
  activeTab = 'overview',
  onTabChange,
  filters = {},
}: ChartTabsProps) {
  const featureDate = rawData.length > 0 ? rawData[0].feature_date : null;

  const {
    csvState,
    databaseState,
    activeSource,
    uploadCSV,
    switchSource,
    clearCSV,
    canToggle,
  } = useWindows();

  const { data: campaignsResponse } = useCampaigns({
    advertiserId: filters.advertiserId ?? null,
    startDate: filters.startDate ? new Date(filters.startDate) : undefined,
    endDate: filters.endDate ? new Date(filters.endDate) : undefined,
  });

  const campaigns = useMemo(
    () => campaignsResponse?.campaigns || [],
    [campaignsResponse?.campaigns]
  );

  const filterCampaignIds = useMemo(() => {
    if (filters.campaignId) {
      return [filters.campaignId];
    }

    const allCampaignIds = campaigns.map(c => c.id);
    return allCampaignIds.length > 0 ? allCampaignIds : undefined;
  }, [filters.campaignId, campaigns]);

  const { hasData, mergedDailyMetrics, campaignWindows } = useWindowData(
    dailyMetrics,
    {
      startDate: filters.startDate,
      endDate: filters.endDate,
      campaignIds: filterCampaignIds,
    },
    campaigns
  );

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Depletion Rate</TabsTrigger>
        <TabsTrigger value="spikes">Spike Analysis</TabsTrigger>
        <TabsTrigger value="windows" disabled={!hasData}>
          Usage Windows {hasData && `(${campaignWindows.length})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="animate-fade-in">
        <Card className="p-6 transition-shadow duration-300 hover:shadow-md">
          <h3 className="text-lg font-semibold mb-4">Depletion Rate Trends</h3>
          <DepletionRateChart
            data={mergedDailyMetrics}
            showMacAvg={true}
            featureDate={featureDate}
            showWindowCount={hasData}
          />
        </Card>
      </TabsContent>

      <TabsContent value="spikes" className="animate-fade-in">
        <Card className="p-6 transition-shadow duration-300 hover:shadow-md">
          <h3 className="text-lg font-semibold mb-4">Spike Detection Analysis</h3>
          <SpikeCountChart
            data={mergedDailyMetrics}
            featureDate={featureDate}
            showWindowCount={hasData}
          />
        </Card>
      </TabsContent>

      <TabsContent value="windows" className="animate-fade-in">
        <Card className="p-6 transition-shadow duration-300 hover:shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold">Usage Windows Timeline</h3>
            <WindowDataControls
              csvState={csvState}
              databaseState={databaseState}
              activeSource={activeSource}
              onUploadCSV={uploadCSV}
              onSwitchSource={switchSource}
              onClearCSV={clearCSV}
              canToggle={canToggle}
            />
          </div>
          {hasData ? (
            <WindowTimelineChart data={campaignWindows} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {databaseState.status === 'loading' ? (
                'Loading usage windows from database...'
              ) : databaseState.status === 'error' ? (
                'Failed to load usage windows. Please try again or upload a CSV file.'
              ) : (
                'No usage windows data available. Upload a CSV file or select filters to load data from the database.'
              )}
            </div>
          )}
        </Card>
      </TabsContent>
    </Tabs>
  );
}
