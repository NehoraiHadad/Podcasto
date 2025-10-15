import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  label: string;
  color: string;
  icon: LucideIcon;
  isLoading: boolean;
  isPending: boolean;
}

/**
 * Presentational component for displaying status badge with icon and loading state
 */
export function StatusBadge({
  label,
  color,
  icon: Icon,
  isLoading,
  isPending
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`${color} text-white px-2 py-1`}
    >
      <Icon className="h-3 w-3 mr-1" />
      <span>{label}</span>
      {isLoading && isPending && (
        <Loader2 className="h-3 w-3 ml-1 animate-spin" />
      )}
    </Badge>
  );
}
