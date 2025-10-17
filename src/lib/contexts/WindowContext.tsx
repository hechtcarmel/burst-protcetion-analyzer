'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { parseWindowCSV, readFileAsText } from '@/lib/utils/csv-parser';
import { filterWindows, aggregateWindowsByDay, aggregateWindowsByCampaign } from '@/lib/analytics/window-aggregators';
import type { WindowRow, WindowMetrics, CampaignWindow } from '@/types/window';
import type { Campaign } from '@/lib/db/types';

interface WindowContextType {
  windowData: WindowRow[];
  hasData: boolean;
  uploadCSV: (file: File) => Promise<void>;
  clearData: () => void;
  getFilteredWindows: (filters: {
    startDate?: Date;
    endDate?: Date;
    campaignIds?: number[];
  }) => WindowRow[];
  getDailyMetrics: (filters: {
    startDate?: Date;
    endDate?: Date;
    campaignIds?: number[];
  }) => WindowMetrics[];
  getCampaignMetrics: (filters: {
    startDate?: Date;
    endDate?: Date;
    campaignIds?: number[];
  }, campaigns?: Campaign[]) => CampaignWindow[];
  isLoading: boolean;
  error: string | null;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

export function WindowProvider({ children }: { children: ReactNode }) {
  const [windowData, setWindowData] = useState<WindowRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadCSV = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const content = await readFileAsText(file);
      const parsed = parseWindowCSV(content);
      setWindowData(parsed);
      console.log(`Successfully loaded ${parsed.length} window records`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse CSV';
      setError(errorMessage);
      console.error('CSV upload error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = () => {
    setWindowData([]);
    setError(null);
  };

  const getFilteredWindows = (filters: {
    startDate?: Date;
    endDate?: Date;
    campaignIds?: number[];
  }) => {
    return filterWindows(windowData, filters);
  };

  const getDailyMetrics = (filters: {
    startDate?: Date;
    endDate?: Date;
    campaignIds?: number[];
  }) => {
    const filtered = getFilteredWindows(filters);
    return aggregateWindowsByDay(filtered);
  };

  const getCampaignMetrics = (
    filters: {
      startDate?: Date;
      endDate?: Date;
      campaignIds?: number[];
    },
    campaigns?: Campaign[]
  ) => {
    const filtered = getFilteredWindows(filters);
    return aggregateWindowsByCampaign(filtered, campaigns);
  };

  return (
    <WindowContext.Provider
      value={{
        windowData,
        hasData: windowData.length > 0,
        uploadCSV,
        clearData,
        getFilteredWindows,
        getDailyMetrics,
        getCampaignMetrics,
        isLoading,
        error,
      }}
    >
      {children}
    </WindowContext.Provider>
  );
}

export function useWindows() {
  const context = useContext(WindowContext);
  if (context === undefined) {
    throw new Error('useWindows must be used within a WindowProvider');
  }
  return context;
}
