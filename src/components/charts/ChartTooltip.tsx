'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { getDepletionRateLabel, getDepletionRateStatus } from '@/lib/utils/color';

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  date?: Date;
}

export function ChartTooltip({ active, payload, label, date }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const displayDate = date || (data.date ? new Date(data.date) : null);

  return (
    <Card className="p-3 shadow-xl border-2 bg-card/95 backdrop-blur-sm">
      <div className="space-y-2">
        {displayDate && (
          <p className="font-semibold text-sm border-b pb-2 mb-2">
            {format(displayDate, 'PPP')}
          </p>
        )}

        <div className="space-y-1.5">
          {payload.map((entry: any) => {
            const value = entry.value;
            const isPercentage = entry.name?.includes('Rate') || entry.name?.includes('%');
            const displayValue = isPercentage ? `${value.toFixed(2)}%` : value.toLocaleString();

            let statusBadge = null;
            if (entry.name === 'Avg Depletion Rate' || entry.dataKey === 'avgDepletionRate') {
              const status = getDepletionRateStatus(value);
              const label = getDepletionRateLabel(value);
              const badgeVariant = {
                excellent: 'default' as const,
                good: 'secondary' as const,
                warning: 'outline' as const,
                critical: 'destructive' as const,
              }[status];

              statusBadge = (
                <Badge variant={badgeVariant} className="text-xs ml-2">
                  {label}
                </Badge>
              );
            }

            return (
              <div key={entry.name} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground">{entry.name}:</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold tabular-nums">{displayValue}</span>
                  {statusBadge}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

interface DepletionTooltipProps {
  active?: boolean;
  payload?: any[];
}

export function DepletionTooltip({ active, payload }: DepletionTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const depletionRate = data.avgDepletionRate || 0;
  const macAvg = data.macAvg || 0;

  return (
    <Card className="p-4 shadow-xl border-2 bg-card/95 backdrop-blur-sm min-w-[280px]">
      <div className="space-y-3">
        <p className="font-semibold border-b pb-2">
          {format(new Date(data.date), 'PPP')}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Depletion Rate</p>
            <p className="text-2xl font-bold tabular-nums">{depletionRate.toFixed(1)}%</p>
            <Badge
              variant={getDepletionRateStatus(depletionRate) === 'critical' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {getDepletionRateLabel(depletionRate)}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">MAC Average</p>
            <p className="text-2xl font-bold tabular-nums">{macAvg.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">
              {depletionRate > macAvg ? 'Above' : 'Below'} MAC
            </p>
          </div>
        </div>

        {data.windowDurationDisplay && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Active Time</p>
            <p className="text-sm font-semibold">{data.windowDurationDisplay}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
