import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { getAllCreditPackagesAction, getCreditStatisticsAction } from '@/lib/actions/credit';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus } from 'lucide-react';
import Link from 'next/link';
import { CreditPackagesTable } from '@/components/admin/credits/credit-packages-table';

export const metadata = {
  title: 'Credit Packages | Admin Dashboard | Podcasto',
  description: 'Manage credit packages',
};

export const dynamic = 'force-dynamic';

function CreditPackagesListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full max-w-sm" />
      <div className="border rounded-md p-4">
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

async function CreditStatisticsCards() {
  const statsResult = await getCreditStatisticsAction();

  if (!statsResult.success || !statsResult.data) {
    return null;
  }

  const stats = statsResult.data;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Users with credits</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Credits Distributed</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCreditsDistributed.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCreditsUsed.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalCreditsDistributed > 0
              ? `${((stats.totalCreditsUsed / stats.totalCreditsDistributed) * 100).toFixed(1)}% usage rate`
              : 'No usage'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Free Credits</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalFreeCredits.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Bonus credits granted</p>
        </CardContent>
      </Card>
    </div>
  );
}

async function CreditPackagesList() {
  const packagesResult = await getAllCreditPackagesAction();

  if (!packagesResult.success || !packagesResult.data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load credit packages</p>
        <p className="text-sm text-red-500">
          {!packagesResult.success ? packagesResult.error : 'No data returned'}
        </p>
      </div>
    );
  }

  return <CreditPackagesTable packages={packagesResult.data} />;
}

export default async function CreditPackagesPage() {
  await checkIsAdmin({ redirectOnFailure: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Credit Packages</h1>
        <Button asChild>
          <Link href="/admin/credits/packages/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Package
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        }
      >
        <CreditStatisticsCards />
      </Suspense>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Packages</h2>
        <Suspense fallback={<CreditPackagesListSkeleton />}>
          <CreditPackagesList />
        </Suspense>
      </div>
    </div>
  );
}
