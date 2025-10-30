import { DateRange } from 'react-day-picker';

export interface DateRangePreset {
  value: string;
  label: string;
  description?: string;
}

export const calculatePresetRange = ({
  preset,
}: {
  preset: string;
}): DateRange | undefined => {
  const now = new Date();
  let start: Date;

  switch (preset) {
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
      return undefined;
  }

  return { from: start, to: now };
};

export const calculateDaysBetween = ({
  from,
  to,
}: {
  from: Date;
  to: Date;
}): number => {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
};

export const formatDateRange = ({
  range,
  _format = 'MMM dd, yyyy',
}: {
  range: DateRange | undefined;
  _format?: string;
}): string => {
  if (!range?.from) return '';
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!range.to) return formatDate(range.from);
  
  return `${formatDate(range.from)} → ${formatDate(range.to)}`;
};

export const getDefaultPresets = ({
  defaultHours,
}: {
  defaultHours: number;
}): DateRangePreset[] => {
  return [
    {
      value: 'default',
      label: 'Default',
      description: `Last ${defaultHours}h (recommended)`,
    },
    {
      value: '24h',
      label: 'Last 24 hours',
      description: '1 day',
    },
    {
      value: '3d',
      label: 'Last 3 days',
      description: '72 hours',
    },
    {
      value: '7d',
      label: 'Last week',
      description: '7 days',
    },
    {
      value: '30d',
      label: 'Last month',
      description: '30 days',
    },
  ];
};

