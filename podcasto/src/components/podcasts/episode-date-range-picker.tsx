'use client';

import { useState } from 'react';
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

export interface DateRangePickerProps {
  onRangeSelect: (startDate: Date, endDate: Date) => void;
  onClear: () => void;
  defaultHours?: number;
  className?: string;
}

export function EpisodeDateRangePicker({
  onRangeSelect,
  onClear,
  defaultHours = 24,
  className,
}: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>();
  const [preset, setPreset] = useState<string>('default');

  const handlePresetChange = (value: string) => {
    setPreset(value);

    if (value === 'clear') {
      setDate(undefined);
      onClear();
      setPreset('default');
      return;
    }

    if (value === 'default') {
      setDate(undefined);
      onClear();
      return;
    }

    const now = new Date();
    let start: Date;

    switch (value) {
      case '24h':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '3d':
        start = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return;
    }

    const newRange = { from: start, to: now };
    setDate(newRange);
    onRangeSelect(start, now);
  };

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);
    setPreset('custom');

    if (selectedDate?.from && selectedDate?.to) {
      onRangeSelect(selectedDate.from, selectedDate.to);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={preset} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default ({defaultHours}h)</SelectItem>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="3d">Last 3 days</SelectItem>
            <SelectItem value="7d">Last week</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="custom">Custom range...</SelectItem>
            {date && <SelectItem value="clear">Clear selection</SelectItem>}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-full sm:w-auto justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              {date?.from ? (
                date.to ? (
                  <span className="truncate">
                    {format(date.from, 'MMM dd, y')} - {format(date.to, 'MMM dd, y')}
                  </span>
                ) : (
                  format(date.from, 'MMM dd, y')
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
      <p className="text-xs text-muted-foreground leading-relaxed">
        Choose &apos;Custom range&apos; to pick specific dates, or use the default for the most recent updates.
      </p>
    </div>
  );
}

