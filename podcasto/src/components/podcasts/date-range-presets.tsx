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
        <SelectTrigger className="w-full min-h-[44px] h-11 text-sm">
          <SelectValue placeholder="Choose a time period" />
        </SelectTrigger>
        <SelectContent className="max-h-[60vh]">
          {presets.map((preset) => (
            <SelectItem 
              key={preset.value} 
              value={preset.value}
              className="min-h-[44px] cursor-pointer"
            >
              <div className="flex items-center justify-between w-full gap-2">
                <span className="text-sm">{preset.label}</span>
                {preset.description && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {preset.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
          <SelectItem value="custom" className="min-h-[44px] cursor-pointer">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm">Custom dates...</span>
              <CalendarIcon className="h-3 w-3 ml-2" />
            </div>
          </SelectItem>
          {hasCustomDate && (
            <SelectItem value="clear" className="min-h-[44px] cursor-pointer">
              <span className="text-sm">Clear custom selection</span>
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export { calculatePresetRange };

