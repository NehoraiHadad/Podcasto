'use client';

import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EpisodeDateRangePicker } from '../../episode-date-range-picker';
import type { DateRange } from '../types';

interface SelectionStepProps {
  isPaused: boolean;
  dateRange: DateRange | null;
  onDateRangeSelect: (startDate: Date, endDate: Date) => void;
  onClearDateRange: () => void;
}

export function SelectionStep({
  isPaused,
  dateRange,
  onDateRangeSelect,
  onClearDateRange,
}: SelectionStepProps) {
  return (
    <div className="space-y-4">
      {isPaused && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This podcast is paused. Episodes will be created but automatic scheduling is disabled.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Select Date Range</label>
        <EpisodeDateRangePicker
          onRangeSelect={onDateRangeSelect}
          onClear={onClearDateRange}
          defaultHours={24}
        />
      </div>

      {dateRange && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Selected: {dateRange.startDate.toLocaleDateString()} -{' '}
            {dateRange.endDate.toLocaleDateString()}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
