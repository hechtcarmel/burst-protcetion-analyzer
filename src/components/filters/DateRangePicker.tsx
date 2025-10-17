'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { getDateRangePreset } from '@/lib/utils/date';
import type { DateRange } from '@/types/filters';
import type { DateRange as DayPickerDateRange } from 'react-day-picker';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalRange, setInternalRange] = useState<DayPickerDateRange | undefined>(undefined);

  // Reset internal range when popover opens
  useEffect(() => {
    if (isOpen) {
      setInternalRange(undefined);
    }
  }, [isOpen]);

  const presets = [
    { label: 'Last 7 days', value: '7d' as const },
    { label: 'Last 14 days', value: '14d' as const },
    { label: 'Last 30 days', value: '30d' as const },
    { label: 'Last 90 days', value: '90d' as const },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(value.start, 'MMM dd, yyyy')} - {format(value.end, 'MMM dd, yyyy')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="border-r p-3 space-y-2">
            <p className="text-sm font-medium mb-2">Presets</p>
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  const range = getDateRangePreset(preset.value);
                  onChange(range);
                  setIsOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="p-3">
            <Calendar
              mode="range"
              selected={internalRange}
              onSelect={(range: DayPickerDateRange | undefined) => {
                setInternalRange(range);
                if (range?.from && range?.to && range.from.getTime() !== range.to.getTime()) {
                  onChange({
                    start: startOfDay(range.from),
                    end: endOfDay(range.to)
                  });
                  setIsOpen(false);
                }
              }}
              numberOfMonths={2}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
