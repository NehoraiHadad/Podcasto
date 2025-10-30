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
    if (!date?.from) return 'Pick dates';

    if (date.to) {
      return `${format(date.from, 'MMM dd')} → ${format(date.to, 'MMM dd, yyyy')}`;
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
              'w-full justify-start text-left font-normal h-11 text-sm md:text-base min-h-[44px]',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate text-xs sm:text-sm">{formatDateDisplay()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 max-w-[calc(100vw-2rem)]" 
          align="center" 
          side="bottom"
          sideOffset={8}
        >
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateSelect}
            numberOfMonths={1}
            disabled={(date) => date > new Date()}
            timeZone={timeZone}
            captionLayout="dropdown"
            className="rounded-lg border shadow-sm md:hidden [--cell-size:2.5rem]"
          />
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateSelect}
            numberOfMonths={2}
            disabled={(date) => date > new Date()}
            timeZone={timeZone}
            captionLayout="dropdown"
            className="rounded-lg border shadow-sm hidden md:block"
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

