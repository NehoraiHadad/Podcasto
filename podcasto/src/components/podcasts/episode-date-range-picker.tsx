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
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Content Time Range
        </label>
        <p className="text-xs text-muted-foreground">
          Select which period of your channel content to include in this episode
        </p>
      </div>

      {/* Quick Presets */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Quick Selection
        </label>
        <Select value={preset} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">
              <div className="flex items-center justify-between w-full">
                <span>Default</span>
                <span className="text-xs text-muted-foreground ml-2">Last {defaultHours}h (recommended)</span>
              </div>
            </SelectItem>
            <SelectItem value="24h">
              <div className="flex items-center justify-between w-full">
                <span>Last 24 hours</span>
                <span className="text-xs text-muted-foreground ml-2">1 day</span>
              </div>
            </SelectItem>
            <SelectItem value="3d">
              <div className="flex items-center justify-between w-full">
                <span>Last 3 days</span>
                <span className="text-xs text-muted-foreground ml-2">72 hours</span>
              </div>
            </SelectItem>
            <SelectItem value="7d">
              <div className="flex items-center justify-between w-full">
                <span>Last week</span>
                <span className="text-xs text-muted-foreground ml-2">7 days</span>
              </div>
            </SelectItem>
            <SelectItem value="30d">
              <div className="flex items-center justify-between w-full">
                <span>Last month</span>
                <span className="text-xs text-muted-foreground ml-2">30 days</span>
              </div>
            </SelectItem>
            <SelectItem value="custom">
              <div className="flex items-center justify-between w-full">
                <span>Custom dates...</span>
                <CalendarIcon className="h-3 w-3 ml-2" />
              </div>
            </SelectItem>
            {date && <SelectItem value="clear">Clear custom selection</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Date Picker - only show when custom is selected or date is set */}
      {(preset === 'custom' || date) && (
        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Custom Date Range
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className={cn(
                  'w-full justify-start text-left font-normal h-11',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                {date?.from ? (
                  date.to ? (
                    <span className="truncate">
                      {format(date.from, 'MMM dd, yyyy')} → {format(date.to, 'MMM dd, yyyy')}
                    </span>
                  ) : (
                    format(date.from, 'MMM dd, yyyy')
                  )
                ) : (
                  <span>Click to pick start and end dates</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" side="bottom">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                disabled={(date) => date > new Date()}
                className="rounded-lg border shadow-sm"
              />
            </PopoverContent>
          </Popover>
          {date?.from && date?.to && (
            <p className="text-xs text-muted-foreground">
              {Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24))} days selected
            </p>
          )}
        </div>
      )}
    </div>
  );
}

