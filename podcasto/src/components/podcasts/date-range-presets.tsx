'use client';

import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  calculatePresetRange,
  getDefaultPresets,
} from '@/lib/utils/date-range-helpers';

export interface DateRangePresetsProps {
  value: string;
  onValueChange: (value: string) => void;
  hasCustomDate: boolean;
  defaultHours?: number;
}

export function DateRangePresets({
  value,
  onValueChange,
  hasCustomDate,
  defaultHours = 24,
}: DateRangePresetsProps) {
  const presets = getDefaultPresets({ defaultHours });

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Quick Selection
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a time period" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              <div className="flex items-center justify-between w-full">
                <span>{preset.label}</span>
                {preset.description && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {preset.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
          <SelectItem value="custom">
            <div className="flex items-center justify-between w-full">
              <span>Custom dates...</span>
              <CalendarIcon className="h-3 w-3 ml-2" />
            </div>
          </SelectItem>
          {hasCustomDate && (
            <SelectItem value="clear">Clear custom selection</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export { calculatePresetRange };

