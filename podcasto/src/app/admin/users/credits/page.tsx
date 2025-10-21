import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { getAllUsersWithCreditsAction } from '@/lib/actions/credit';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UsersCreditsTable } from '@/components/admin/credits/users-credits-table';

export const metadata = {
  title: 'User Credits | Admin Dashboard | Podcasto',
  description: 'View and manage user credits',
};

export const dynamic = 'force-dynamic';

function UsersCreditsListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full max-w-sm" />
      <div className="border rounded-md p-4">
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

async function UsersCreditsListContent({
  page = 1,
}: {
  page?: number;
}) {
  const result = await getAllUsersWithCreditsAction(page, 50);

  if (!result.success || !result.data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load user credits</p>
        <p className="text-sm text-red-500">
          {!result.success ? result.error : 'No data returned'}
        </p>
      </div>
    );
  }

  return (
    <UsersCreditsTable
      users={result.data.users}
      total={result.data.total}
      currentPage={page}
      pageSize={50}
    />
  );
}

export default async function UsersCreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await checkIsAdmin({ redirectOnFailure: true });

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Credits</h1>
        <p className="text-muted-foreground mt-2">
          View and manage credit balances for all users
        </p>
      </div>

      <Suspense fallback={<UsersCreditsListSkeleton />}>
        <UsersCreditsListContent page={page} />
      </Suspense>
    </div>
  );
}
