'use client';

import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface ContentDateRangeBadgeProps {
  startDate: string | null;
  endDate: string | null;
  className?: string;
}

export function ContentDateRangeBadge({
  startDate,
  endDate,
  className,
}: ContentDateRangeBadgeProps) {
  // If no custom date range, show default indicator
  if (!startDate || !endDate) {
    return (
      <Badge variant="outline" className={className}>
        Default
      </Badge>
    );
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Format dates
    const startFormatted = format(start, 'MMM d');
    const endFormatted = format(end, 'MMM d, yyyy');

    // Full date range for tooltip
    const fullRange = `${format(start, 'PPP')} - ${format(end, 'PPP')}`;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={`gap-1 ${className}`}
          >
            <Calendar className="h-3 w-3" />
            {startFormatted} - {endFormatted}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{fullRange}</p>
        </TooltipContent>
      </Tooltip>
    );
  } catch (error) {
    console.error('Error formatting dates:', error);
    return (
      <Badge variant="outline" className={className}>
        Invalid dates
      </Badge>
    );
  }
}
