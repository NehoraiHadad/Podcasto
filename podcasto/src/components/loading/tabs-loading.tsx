import { Skeleton } from '@/components/ui/skeleton';
import type { TabsLoadingProps } from './types';

/**
 * Tabs Loading Component
 * Shows skeleton for tabbed content pages (like costs page)
 */
export function TabsLoading({ tabs = 3, contentHeight = 400 }: TabsLoadingProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b pb-2">
        {Array.from({ length: tabs }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24" />
        ))}
      </div>
      
      <Skeleton className={`h-[${contentHeight}px] w-full`} />
    </div>
  );
}

