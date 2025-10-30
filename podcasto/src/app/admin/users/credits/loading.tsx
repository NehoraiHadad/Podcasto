import { TableLoading } from '@/components/loading';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminUsersCreditsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <TableLoading rows={15} columns={6} />
    </div>
  );
}

