'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, eachDayOfInterval } from 'date-fns';
import { getHeatmapColor } from '@/lib/utils/color';
import type { BurstProtectionRow } from '@/lib/db/types';

interface BlockingHeatmapProps {
  data: BurstProtectionRow[];
  height?: number;
}

export default function BlockingHeatmap({ data, height = 400 }: BlockingHeatmapProps) {
  const heatmapData = useMemo(() => {
    const grouped = new Map<number, Map<string, number>>();

    data.forEach((row) => {
      if (!grouped.has(row.advertiser_id)) {
        grouped.set(row.advertiser_id, new Map());
      }
      const dateObj = typeof row.data_timestamp_by_request_time === 'string'
        ? new Date(row.data_timestamp_by_request_time)
        : row.data_timestamp_by_request_time;
      const dateKey = format(dateObj, 'yyyy-MM-dd');
      grouped.get(row.advertiser_id)!.set(dateKey, row.amount_of_blocking || 0);
    });

    const dates = data.map((d) => {
      const dateObj = typeof d.data_timestamp_by_request_time === 'string'
        ? new Date(d.data_timestamp_by_request_time)
        : d.data_timestamp_by_request_time;
      return dateObj;
    });
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    const allDates = eachDayOfInterval({ start: minDate, end: maxDate });

    const allValues = data.map((d) => d.amount_of_blocking || 0);
    const maxValue = Math.max(...allValues, 1);

    return {
      advertisers: Array.from(grouped.entries()),
      dates: allDates,
      maxValue,
    };
  }, [data]);

  const cellSize = 15;
  const cellGap = 2;

  return (
    <Card className="p-4">
      <div className="overflow-auto" style={{ maxHeight: height }}>
        <TooltipProvider>
          <svg
            width={heatmapData.dates.length * (cellSize + cellGap) + 100}
            height={heatmapData.advertisers.length * (cellSize + cellGap) + 50}
          >
            {heatmapData.dates.map((date, colIndex) => (
              <text
                key={colIndex}
                x={100 + colIndex * (cellSize + cellGap) + cellSize / 2}
                y={20}
                fontSize="10"
                textAnchor="middle"
              >
                {format(date, 'MM/dd')}
              </text>
            ))}

            {heatmapData.advertisers.map(([advertiserId, dateMap], rowIndex) => {
              const advertiser = data.find((d) => d.advertiser_id === advertiserId);

              return (
                <g key={advertiserId}>
                  <text
                    x={90}
                    y={40 + rowIndex * (cellSize + cellGap) + cellSize / 2}
                    fontSize="10"
                    textAnchor="end"
                    alignmentBaseline="middle"
                  >
                    {advertiser?.description.substring(0, 15)}
                  </text>

                  {heatmapData.dates.map((date, colIndex) => {
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const value = dateMap.get(dateKey) || 0;
                    const color = getHeatmapColor(value, heatmapData.maxValue);

                    return (
                      <Tooltip key={colIndex}>
                        <TooltipTrigger asChild>
                          <rect
                            x={100 + colIndex * (cellSize + cellGap)}
                            y={30 + rowIndex * (cellSize + cellGap)}
                            width={cellSize}
                            height={cellSize}
                            fill={color}
                            stroke="#e5e7eb"
                            strokeWidth={1}
                            style={{ cursor: 'pointer' }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <p className="font-semibold">{advertiser?.description}</p>
                            <p>{format(date, 'PP')}</p>
                            <p>Blocking: ${value.toFixed(2)}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </TooltipProvider>
      </div>
    </Card>
  );
}
