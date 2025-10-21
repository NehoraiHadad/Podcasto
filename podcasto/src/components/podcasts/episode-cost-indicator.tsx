import { CheckCircle2, AlertCircle, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EpisodeCostIndicatorProps {
  userCredits: number;
  episodeCost: number;
  className?: string;
  showLabel?: boolean;
}

export function EpisodeCostIndicator({
  userCredits,
  episodeCost,
  className,
  showLabel = true
}: EpisodeCostIndicatorProps) {
  const hasEnoughCredits = userCredits >= episodeCost;
  const deficit = hasEnoughCredits ? 0 : episodeCost - userCredits;

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <Coins className="h-4 w-4 text-muted-foreground" />

      {showLabel && (
        <span className="text-muted-foreground">
          Episode costs {episodeCost} credits
        </span>
      )}

      {hasEnoughCredits ? (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">{userCredits} available</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="font-medium">
            Need {deficit} more {deficit === 1 ? 'credit' : 'credits'}
          </span>
        </div>
      )}
    </div>
  );
}
