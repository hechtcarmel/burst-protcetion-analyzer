'use client';

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { useTableSort } from '@/lib/hooks/useTableSort';
import { useCSVExport } from '@/lib/hooks/useCSVExport';
import { SortableTableHeader } from './TableHeader';
import { DataTableRow } from './TableRow';
import type { BurstProtectionRow } from '@/lib/db/types';
import type { SortOrder } from '@/types/filters';

interface DataTableProps {
  data: BurstProtectionRow[];
  loading?: boolean;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortOrder?: SortOrder;
}

export default function DataTable({
  data,
  onSort,
  sortKey,
  sortOrder,
}: DataTableProps) {
  const sortedData = useTableSort(data, sortKey, sortOrder);

  const exportToCSV = useCSVExport<BurstProtectionRow>(
    [
      { header: 'Advertiser', accessor: (row) => row.description },
      {
        header: 'Date',
        accessor: (row) =>
          format(
            typeof row.data_timestamp_by_request_time === 'string'
              ? new Date(row.data_timestamp_by_request_time)
              : row.data_timestamp_by_request_time,
            'yyyy-MM-dd'
          ),
      },
      {
        header: 'Feature Date',
        accessor: (row) =>
          format(
            typeof row.feature_date === 'string'
              ? new Date(row.feature_date)
              : row.feature_date,
            'yyyy-MM-dd'
          ),
      },
      {
        header: 'Avg Depletion Rate',
        accessor: (row) => row.avg_depletion_rate?.toFixed(2) || '',
      },
      { header: 'MAC Avg', accessor: (row) => row.mac_avg?.toFixed(2) || '' },
      { header: 'Spikes', accessor: (row) => row.spikes_count || '' },
      {
        header: 'Blocking Amount',
        accessor: (row) => row.amount_of_blocking?.toFixed(2) || '',
      },
      { header: 'Status', accessor: (row) => row.blocking_status },
    ],
    'burst-protection'
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Detailed Data ({sortedData.length} rows)
        </h3>
        <Button variant="outline" size="sm" onClick={() => exportToCSV(sortedData)}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <SortableTableHeader
                  column="description"
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                  onSort={onSort}
                >
                  Advertiser
                </SortableTableHeader>
                <SortableTableHeader
                  column="data_timestamp_by_request_time"
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                  onSort={onSort}
                >
                  Date
                </SortableTableHeader>
                <SortableTableHeader
                  column="avg_depletion_rate"
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                  onSort={onSort}
                >
                  Avg Depletion
                </SortableTableHeader>
                <SortableTableHeader
                  column="mac_avg"
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                  onSort={onSort}
                >
                  MAC Avg
                </SortableTableHeader>
                <SortableTableHeader
                  column="spikes_count"
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                  onSort={onSort}
                >
                  Spikes
                </SortableTableHeader>
                <SortableTableHeader
                  column="amount_of_blocking"
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                  onSort={onSort}
                >
                  Blocking
                </SortableTableHeader>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row, index) => (
                <DataTableRow key={`${row.advertiser_id}-${index}`} row={row} index={index} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
