import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { getUsersListAction } from '@/lib/actions/admin/user-actions';
import { UsersFilters } from '@/components/admin/users/users-filters';
import { UsersTable } from '@/components/admin/users/users-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'Users Management | Podcasto Admin',
  description: 'Manage users, roles, and permissions',
};

export const dynamic = 'force-dynamic';

interface SearchParams {
  page?: string;
  search?: string;
  role?: 'admin' | 'user' | 'all';
  emailStatus?: 'active' | 'bounced' | 'complained' | 'all';
}

interface UsersPageProps {
  searchParams: Promise<SearchParams>;
}

function UsersTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

async function UsersList({
  page,
  search,
  role,
  emailStatus
}: {
  page: number;
  search: string;
  role?: 'admin' | 'user' | 'all';
  emailStatus?: 'active' | 'bounced' | 'complained' | 'all';
}) {
  const result = await getUsersListAction({
    page,
    pageSize: 20,
    search,
    roleFilter: role,
    emailStatusFilter: emailStatus,
  });

  if (!result.success || !result.data) {
    return (
      <div className="text-center py-12 text-destructive">
        Error loading users: {result.error || 'Unknown error'}
      </div>
    );
  }

  const { users, total, totalPages } = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {users.length} of {total} users
        </p>
      </div>

      <UsersTable users={users} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={{
                    pathname: '/admin/users',
                    query: {
                      page: page - 1,
                      ...(search && { search }),
                      ...(role && role !== 'all' && { role }),
                      ...(emailStatus && emailStatus !== 'all' && { emailStatus }),
                    },
                  }}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}

            {page < totalPages ? (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={{
                    pathname: '/admin/users',
                    query: {
                      page: page + 1,
                      ...(search && { search }),
                      ...(role && role !== 'all' && { role }),
                      ...(emailStatus && emailStatus !== 'all' && { emailStatus }),
                    },
                  }}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  await checkIsAdmin({ redirectOnFailure: true });

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || '';
  const role = params.role;
  const emailStatus = params.emailStatus;

  // Validate page number
  if (page < 1) {
    redirect('/admin/users?page=1');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Users Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      <UsersFilters />

      <Suspense fallback={<UsersTableSkeleton />}>
        <UsersList
          page={page}
          search={search}
          role={role}
          emailStatus={emailStatus}
        />
      </Suspense>
    </div>
  );
}
