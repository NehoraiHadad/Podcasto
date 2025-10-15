import { Skeleton } from '@/components/ui/skeleton';
import type { FormLoadingProps } from './types';

export function FormLoading({ fields = 5 }: FormLoadingProps) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 mb-8" />

      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}

      <div className="flex gap-4 pt-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
