'use client';

import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { calculateDaysBetween } from '@/lib/utils/date-range-helpers';

export interface EnhancedRangeCalendarProps {
  date: DateRange | undefined;
  onDateSelect: (date: DateRange | undefined) => void;
  showDateInfo?: boolean;
  className?: string;
}

export function EnhancedRangeCalendar({
  date,
  onDateSelect,
  showDateInfo = true,
  className,
}: EnhancedRangeCalendarProps) {
  const [timeZone, setTimeZone] = useState<string | undefined>(undefined);

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const formatDateDisplay = (): string => {
    if (!date?.from) return 'Click to pick start and end dates';

    if (date.to) {
      return `${format(date.from, 'MMM dd, yyyy')} → ${format(date.to, 'MMM dd, yyyy')}`;
    }

    return format(date.from, 'MMM dd, yyyy');
  };

  const getDaysSelected = (): number => {
    if (!date?.from || !date?.to) return 0;
    return calculateDaysBetween({ from: date.from, to: date.to });
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Custom Date Range
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal h-11',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{formatDateDisplay()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" side="bottom">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateSelect}
            numberOfMonths={2}
            disabled={(date) => date > new Date()}
            timeZone={timeZone}
            captionLayout="dropdown"
            className="rounded-lg border shadow-sm"
          />
        </PopoverContent>
      </Popover>
      {showDateInfo && date?.from && date?.to && (
        <p className="text-xs text-muted-foreground">
          {getDaysSelected()} days selected
        </p>
      )}
    </div>
  );
}

