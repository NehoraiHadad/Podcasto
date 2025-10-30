import { Skeleton } from '@/components/ui/skeleton';

export default function AdminProcessingLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Stats Card */}
      <Skeleton className="h-64 w-full rounded-lg" />

      {/* Failed Episodes */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

