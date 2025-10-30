import { MainLayout } from '@/components/layout/main-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCardsLoading, TableLoading } from '@/components/loading';

export default function TransactionHistoryLoading() {
  return (
    <MainLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Back Button */}
        <Skeleton className="h-9 w-32" />

        {/* Header */}
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>

        {/* Stats Cards */}
        <StatCardsLoading count={3} columns={3} />

        {/* Transactions Table */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-48 mb-4" />
          <TableLoading rows={10} columns={6} />
        </div>
      </div>
    </MainLayout>
  );
}

