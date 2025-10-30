'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface DateRangePreset {
  value: string;
  label: string;
  /**
   * When provided, selecting the preset will call this function to produce the range.
   * If omitted, the preset acts as a simple selector (e.g., "custom").
   */
  calculateRange?: (context: { now: Date }) => DateRange;
}

const DEFAULT_PRESETS: DateRangePreset[] = [
  {
    value: 'default',
    label: 'Default',
  },
  {
    value: '24h',
    label: 'Last 24 hours',
    calculateRange: ({ now }) => ({
      from: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      to: now,
    }),
  },
  {
    value: '3d',
    label: 'Last 3 days',
    calculateRange: ({ now }) => ({
      from: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      to: now,
    }),
  },
  {
    value: '7d',
    label: 'Last week',
    calculateRange: ({ now }) => ({
      from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      to: now,
    }),
  },
  {
    value: '30d',
    label: 'Last 30 days',
    calculateRange: ({ now }) => ({
      from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      to: now,
    }),
  },
  {
    value: 'custom',
    label: 'Custom range',
  },
];

export interface DateRangePickerProps {
  onRangeSelect: (startDate: Date, endDate: Date) => void;
  onClear: () => void;
  defaultHours?: number;
  className?: string;
  value?: DateRange | null;
  onRangeChange?: (range: DateRange | undefined) => void;
  defaultPreset?: string;
  presets?: DateRangePreset[];
}

export function EpisodeDateRangePicker({
  onRangeSelect,
  onClear,
  defaultHours = 24,
  className,
  value,
  onRangeChange,
  defaultPreset = 'default',
  presets,
}: DateRangePickerProps) {
  const availablePresets = useMemo(() => {
    if (!presets) {
      return DEFAULT_PRESETS;
    }

    return presets;
  }, [presets]);

  const [date, setDate] = useState<DateRange | undefined>(value ?? undefined);
  const [preset, setPreset] = useState<string>(defaultPreset);

  useEffect(() => {
    if (value) {
      setDate(value);
      setPreset('custom');
    }
    if (value === null || value === undefined) {
      setDate(undefined);
      setPreset(defaultPreset);
    }
  }, [value, defaultPreset]);

  const handlePresetChange = (selectedPresetValue: string) => {
    setPreset(selectedPresetValue);

    if (selectedPresetValue === 'clear') {
      setDate(undefined);
      onClear();
      onRangeChange?.(undefined);
      setPreset(defaultPreset);
      return;
    }

    const selectedPreset = availablePresets.find((presetOption) => presetOption.value === selectedPresetValue);

    if (!selectedPreset || !selectedPreset.calculateRange) {
      if (selectedPresetValue === 'default') {
        setDate(undefined);
        onClear();
        onRangeChange?.(undefined);
      }
      return;
    }

    const now = new Date();
    const range = selectedPreset.calculateRange({ now });
    setDate(range);
    onRangeChange?.(range);

    if (range.from && range.to) {
      onRangeSelect(range.from, range.to);
    } else if (range.from) {
      onRangeSelect(range.from, range.from);
    }
  };

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);
    setPreset('custom');

    if (selectedDate?.from && selectedDate?.to) {
      onRangeSelect(selectedDate.from, selectedDate.to);
    }

    onRangeChange?.(selectedDate);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex gap-2">
        <Select value={preset} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select preset" />
          </SelectTrigger>
          <SelectContent>
            {availablePresets.map((presetOption) => (
              <SelectItem key={presetOption.value} value={presetOption.value}>
                {presetOption.value === 'default'
                  ? `${presetOption.label} (${defaultHours}h)`
                  : presetOption.label}
              </SelectItem>
            ))}
            {date && <SelectItem value="clear">Clear selection</SelectItem>}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'LLL dd, y')} -{' '}
                    {format(date.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(date.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              disabled={(date) => date > new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
