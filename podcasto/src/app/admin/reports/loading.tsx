import { TableLoading } from '@/components/loading';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminReportsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="space-y-6">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>

        <TableLoading rows={15} columns={6} />
      </div>
    </div>
  );
}

