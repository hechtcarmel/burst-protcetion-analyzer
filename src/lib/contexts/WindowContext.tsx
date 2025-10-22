'use client';

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { parseWindowCSV, readFileAsText } from '@/lib/utils/csv-parser';
import { filterWindows, aggregateWindowsByDay, aggregateWindowsByCampaign } from '@/lib/analytics/window-aggregators';
import type { WindowRow, WindowMetrics, CampaignWindow, WindowDataState, DatabaseWindowRow } from '@/types/window';
import type { Campaign } from '@/lib/db/types';

interface WindowContextValue {
  // Discriminated state for CSV data
  csvState: WindowDataState;

  // Discriminated state for database data
  databaseState: WindowDataState;

  // Active source selector
  activeSource: 'csv' | 'database' | null;

  // Type-safe actions
  uploadCSV: (file: File) => Promise<void>;
  clearCSV: () => void;
  loadFromDatabase: (data: DatabaseWindowRow[]) => void;
  setDatabaseLoading: () => void;
  setDatabaseError: (error: string) => void;
  switchSource: (source: 'csv' | 'database') => void;

  // Computed properties
  hasData: boolean;
  activeData: WindowRow[];
  canToggle: boolean;

  // Helper methods (work with active data)
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
}

const WindowContext = createContext<WindowContextValue | undefined>(undefined);

export function WindowProvider({ children }: { children: ReactNode }) {
  const [csvState, setCsvState] = useState<WindowDataState>({
    status: 'idle',
    source: null,
    data: [],
  });

  const [databaseState, setDatabaseState] = useState<WindowDataState>({
    status: 'idle',
    source: null,
    data: [],
  });

  const [activeSource, setActiveSource] = useState<'csv' | 'database' | null>(null);

  // Upload CSV action
  const uploadCSV = useCallback(async (file: File) => {
    setCsvState({ status: 'loading', source: 'csv', data: [] });

    try {
      const content = await readFileAsText(file);
      const parsed = parseWindowCSV(content);
      setCsvState({ status: 'success', source: 'csv', data: parsed });
      // Auto-switch to CSV when uploaded
      setActiveSource('csv');
      console.log(`Successfully loaded ${parsed.length} CSV window records`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse CSV';
      setCsvState({ status: 'error', source: 'csv', error: errorMessage, data: [] });
      console.error('CSV upload error:', err);
      throw err;
    }
  }, []);

  // Clear CSV action
  const clearCSV = useCallback(() => {
    setCsvState({ status: 'idle', source: null, data: [] });
    // Switch to database if available, otherwise null
    if (databaseState.status === 'success') {
      setActiveSource('database');
    } else {
      setActiveSource(null);
    }
  }, [databaseState.status]);

  // Load from database action
  const loadFromDatabase = useCallback((data: DatabaseWindowRow[]) => {
    setDatabaseState({ status: 'success', source: 'database', data });
    // Auto-switch to database if no active source
    if (activeSource === null) {
      setActiveSource('database');
    }
    console.log(`Successfully loaded ${data.length} database window records`);
  }, [activeSource]);

  // Set database loading action
  const setDatabaseLoading = useCallback(() => {
    setDatabaseState({ status: 'loading', source: 'database', data: [] });
  }, []);

  // Set database error action
  const setDatabaseError = useCallback((error: string) => {
    setDatabaseState({ status: 'error', source: 'database', error, data: [] });
  }, []);

  // Switch source action
  const switchSource = useCallback((source: 'csv' | 'database') => {
    const targetState = source === 'csv' ? csvState : databaseState;
    if (targetState.status === 'success') {
      setActiveSource(source);
    }
  }, [csvState, databaseState]);

  // Computed: active data (type-safe based on source)
  const activeData = useMemo((): WindowRow[] => {
    if (activeSource === 'csv' && csvState.status === 'success') {
      return csvState.data;
    }
    if (activeSource === 'database' && databaseState.status === 'success') {
      return databaseState.data;
    }
    return [];
  }, [activeSource, csvState, databaseState]);

  // Computed: has data
  const hasData = activeData.length > 0;

  // Computed: can toggle (both sources have data)
  const canToggle = csvState.status === 'success' && databaseState.status === 'success';

  // Helper: get filtered windows
  const getFilteredWindows = useCallback((filters: {
    startDate?: Date;
    endDate?: Date;
    campaignIds?: number[];
  }) => {
    return filterWindows(activeData, filters);
  }, [activeData]);

  // Helper: get daily metrics
  const getDailyMetrics = useCallback((filters: {
    startDate?: Date;
    endDate?: Date;
    campaignIds?: number[];
  }) => {
    const filtered = filterWindows(activeData, filters);
    return aggregateWindowsByDay(filtered);
  }, [activeData]);

  // Helper: get campaign metrics
  const getCampaignMetrics = useCallback((
    filters: {
      startDate?: Date;
      endDate?: Date;
      campaignIds?: number[];
    },
    campaigns?: Campaign[]
  ) => {
    const filtered = filterWindows(activeData, filters);
    return aggregateWindowsByCampaign(filtered, campaigns);
  }, [activeData]);

  return (
    <WindowContext.Provider
      value={{
        csvState,
        databaseState,
        activeSource,
        uploadCSV,
        clearCSV,
        loadFromDatabase,
        setDatabaseLoading,
        setDatabaseError,
        switchSource,
        hasData,
        activeData,
        canToggle,
        getFilteredWindows,
        getDailyMetrics,
        getCampaignMetrics,
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
