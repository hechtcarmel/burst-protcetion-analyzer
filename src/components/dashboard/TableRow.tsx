'use client';

import React, { useState } from 'react';
import { TableCell, TableRow as UITableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { formatPercent } from '@/lib/utils/format';
import type { BurstProtectionRow } from '@/lib/db/types';

interface DataTableRowProps {
  row: BurstProtectionRow;
  index: number;
}

export function DataTableRow({ row, index }: DataTableRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const timestamp = typeof row.data_timestamp_by_request_time === 'string'
    ? new Date(row.data_timestamp_by_request_time)
    : row.data_timestamp_by_request_time;

  const featureDate = typeof row.feature_date === 'string'
    ? new Date(row.feature_date)
    : row.feature_date;

  const daysSinceFeature = Math.floor(
    (timestamp.getTime() - featureDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <React.Fragment key={`${row.advertiser_id}-${index}`}>
      <UITableRow
        className="cursor-pointer hover:bg-muted/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
        onClick={toggleExpanded}
      >
        <TableCell>
          <Button variant="ghost" size="sm">
            {isExpanded
              ? <ChevronUp className="h-4 w-4" />
              : <ChevronDown className="h-4 w-4" />
            }
          </Button>
        </TableCell>
        <TableCell className="font-medium">{row.description}</TableCell>
        <TableCell>
          {format(timestamp, 'MMM dd, yyyy')}
        </TableCell>
        <TableCell>
          {row.avg_depletion_rate ? formatPercent(row.avg_depletion_rate) : '-'}
        </TableCell>
        <TableCell>
          {row.mac_avg ? formatPercent(row.mac_avg) : '-'}
        </TableCell>
        <TableCell>{row.spikes_count ?? '-'}</TableCell>
        <TableCell>${row.amount_of_blocking?.toFixed(2) ?? '-'}</TableCell>
        <TableCell>
          <Badge variant={row.blocking_status === 'BLOCKED' ? 'destructive' : 'secondary'}>
            {row.blocking_status}
          </Badge>
        </TableCell>
      </UITableRow>
      {isExpanded && (
        <UITableRow className="animate-slide-in">
          <TableCell colSpan={8} className="bg-muted/30">
            <div className="p-4 space-y-2">
              <p><strong>Advertiser ID:</strong> {row.advertiser_id}</p>
              <p><strong>Feature Date:</strong> {format(featureDate, 'PPP')}</p>
              <p><strong>Days Since Feature:</strong> {daysSinceFeature}</p>
            </div>
          </TableCell>
        </UITableRow>
      )}
    </React.Fragment>
  );
}
