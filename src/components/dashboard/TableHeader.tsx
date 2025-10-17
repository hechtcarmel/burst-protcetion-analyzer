'use client';

import { Button } from '@/components/ui/button';
import { TableHead } from '@/components/ui/table';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { SortOrder } from '@/types/filters';

interface TableHeaderProps {
  column: string;
  sortKey?: string;
  sortOrder?: SortOrder;
  onSort?: (column: string) => void;
  children: React.ReactNode;
}

export function SortableTableHeader({
  column,
  sortKey,
  sortOrder,
  onSort,
  children,
}: TableHeaderProps) {
  const isActive = sortKey === column;

  return (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => onSort?.(column)}
      >
        {children}
        {isActive && (
          sortOrder === 'asc'
            ? <ChevronUp className="ml-2 h-4 w-4" />
            : <ChevronDown className="ml-2 h-4 w-4" />
        )}
      </Button>
    </TableHead>
  );
}
