'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Database, FileText, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WindowDataState } from '@/types/window';

interface WindowDataControlsProps {
  csvState: WindowDataState;
  databaseState: WindowDataState;
  activeSource: 'csv' | 'database' | null;
  onUploadCSV: (file: File) => Promise<void>;
  onSwitchSource: (source: 'csv' | 'database') => void;
  onClearCSV: () => void;
  onRetryDatabase?: () => void;
  canToggle: boolean;
}

export default function WindowDataControls({
  csvState,
  databaseState,
  activeSource,
  onUploadCSV,
  onSwitchSource,
  onClearCSV,
  onRetryDatabase,
  canToggle,
}: WindowDataControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await onUploadCSV(file);
    } catch {
      // Error is handled in context
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    onClearCSV();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Render source badge
  const renderSourceBadge = () => {
    if (databaseState.status === 'loading') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2"
        >
          <Badge variant="outline" className="gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading usage windows from database...
          </Badge>
        </motion.div>
      );
    }

    if (databaseState.status === 'error') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2"
        >
          <Badge variant="destructive" className="gap-2">
            <X className="h-3 w-3" />
            Failed to load usage windows
          </Badge>
          {onRetryDatabase && (
            <Button variant="ghost" size="sm" onClick={onRetryDatabase}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </motion.div>
      );
    }

    if (databaseState.status === 'success') {
      const count = databaseState.data.length;
      const isActive = activeSource === 'database';

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2"
        >
          <Badge
            variant={isActive ? 'default' : 'outline'}
            className="gap-2 cursor-pointer transition-colors"
            onClick={() => canToggle && onSwitchSource('database')}
          >
            <Database className="h-3 w-3" />
            From DB ({count} usage windows)
            {isActive && <span className="ml-1">✓</span>}
          </Badge>
        </motion.div>
      );
    }

    return null;
  };

  // Render CSV controls
  const renderCSVControls = () => {
    if (csvState.status === 'loading') {
      return (
        <Badge variant="outline" className="gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Uploading CSV...
        </Badge>
      );
    }

    if (csvState.status === 'error') {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="gap-2">
            <X className="h-3 w-3" />
            Upload failed
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      );
    }

    if (csvState.status === 'success') {
      const count = csvState.data.length;
      const isActive = activeSource === 'csv';

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2"
        >
          <Badge
            variant={isActive ? 'secondary' : 'outline'}
            className="gap-2 cursor-pointer transition-colors bg-purple-100 text-purple-900 hover:bg-purple-200"
            onClick={() => canToggle && onSwitchSource('csv')}
          >
            <FileText className="h-3 w-3" />
            Custom CSV ({count} usage windows)
            {isActive && <span className="ml-1">✓</span>}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      );
    }

    // No CSV loaded - show upload button
    if (databaseState.status === 'success') {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Or upload CSV
        </Button>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        Upload Usage Windows CSV
      </Button>
    );
  };

  // Render toggle switch when both sources available
  const renderToggleSwitch = () => {
    if (!canToggle) return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted/50"
      >
        <span className="text-xs text-muted-foreground">Active:</span>
        <div className="flex gap-1">
          <button
            onClick={() => onSwitchSource('database')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              activeSource === 'database'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            Database
          </button>
          <button
            onClick={() => onSwitchSource('csv')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              activeSource === 'csv'
                ? 'bg-purple-600 text-white'
                : 'hover:bg-muted'
            }`}
          >
            CSV
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        id="window-csv-upload"
      />

      <AnimatePresence mode="wait">
        {renderSourceBadge()}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {renderCSVControls()}
      </AnimatePresence>

      {renderToggleSwitch()}

      {csvState.status === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full text-sm text-destructive mt-1"
        >
          {csvState.error}
        </motion.div>
      )}

      {databaseState.status === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full text-sm text-destructive mt-1"
        >
          {databaseState.error}
        </motion.div>
      )}
    </div>
  );
}
