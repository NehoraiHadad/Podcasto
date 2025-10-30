import { StatCardsLoading, TableLoading } from '@/components/loading';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminUserCreditsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="mb-8">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <StatCardsLoading count={3} columns={3} />
      
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <TableLoading rows={10} columns={5} />
      </div>
    </div>
  );
}

