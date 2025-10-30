'use client';

import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { DateRangePresets, calculatePresetRange } from './date-range-presets';
import { EnhancedRangeCalendar } from './enhanced-range-calendar';

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

    if (value === 'custom') {
      return;
    }

    const range = calculatePresetRange({ preset: value });
    if (range?.from && range?.to) {
      setDate(range);
      onRangeSelect(range.from, range.to);
    }
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
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Content Time Range
        </label>
        <p className="text-xs text-muted-foreground">
          Select which period of your channel content to include in this episode
        </p>
      </div>

      <DateRangePresets
        value={preset}
        onValueChange={handlePresetChange}
        hasCustomDate={!!date}
        defaultHours={defaultHours}
      />

      {(preset === 'custom' || date) && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <EnhancedRangeCalendar
            date={date}
            onDateSelect={handleDateSelect}
            showDateInfo={true}
          />
        </div>
      )}
    </div>
  );
}

