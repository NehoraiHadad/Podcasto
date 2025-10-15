import { Badge } from '@/components/ui/badge';
import { ProcessingStage, STAGE_CONFIGS } from '@/types/processing';
import { cn } from '@/lib/utils';

export interface StageBadgeProps {
  stage: ProcessingStage;
  variant?: 'default' | 'compact';
  className?: string;
}

/**
 * Badge component for displaying processing stages with appropriate colors
 */
export function StageBadge({ stage, variant = 'default', className }: StageBadgeProps) {
  const config = STAGE_CONFIGS[stage];
  const color = config?.color || 'gray';

  // Map colors to badge variants and styles
  const colorStyles: Record<string, string> = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  };

  const isCompact = variant === 'compact';

  return (
    <Badge
      className={cn(
        colorStyles[color],
        'font-medium border-0',
        isCompact ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
        className
      )}
    >
      {config?.label || stage}
    </Badge>
  );
}
