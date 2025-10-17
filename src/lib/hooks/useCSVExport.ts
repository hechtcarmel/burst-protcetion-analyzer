import { useCallback } from 'react';
import { format } from 'date-fns';

export interface CSVColumn<T> {
  header: string;
  accessor: (row: T) => string | number | undefined;
}

export function useCSVExport<T>(
  columns: CSVColumn<T>[],
  filenamePrefix: string = 'export'
) {
  const exportToCSV = useCallback((data: T[]) => {
    const headers = columns.map(col => col.header);

    const rows = data.map(row =>
      columns.map(col => {
        const value = col.accessor(row);
        return value !== undefined ? String(value) : '';
      })
    );

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenamePrefix}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [columns, filenamePrefix]);

  return exportToCSV;
}
