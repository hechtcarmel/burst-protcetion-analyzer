'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText } from 'lucide-react';
import { useWindows } from '@/lib/contexts/WindowContext';

export default function WindowUpload() {
  const { hasData, uploadCSV, clearData, isLoading, error } = useWindows();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadCSV(file);
    } catch {
      // Error is handled in context
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    clearData();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        id="window-csv-upload"
      />

      {!hasData ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isLoading ? 'Loading...' : 'Upload Windows CSV'}
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="pointer-events-none">
            <FileText className="mr-2 h-4 w-4" />
            Windows Loaded
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive mt-1">
          {error}
        </div>
      )}
    </div>
  );
}
