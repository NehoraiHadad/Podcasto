import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { getUserCreditDetailsAction } from '@/lib/actions/credit';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { GrantCreditsForm } from '@/components/admin/credits/grant-credits-form';
import { UserTransactionsTable } from '@/components/admin/credits/user-transactions-table';
import { formatDistanceToNow } from 'date-fns';

export const metadata = {
  title: 'User Credit Details | Admin Dashboard | Podcasto',
  description: 'View detailed credit information for a user',
};

export const dynamic = 'force-dynamic';

export default async function UserCreditDetailsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await checkIsAdmin({ redirectOnFailure: true });

  const { userId } = await params;
  const result = await getUserCreditDetailsAction(userId);

  if (!result.success || !result.data) {
    notFound();
  }

  const { credits, transactions } = result.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Credit Details</h1>
        <p className="text-muted-foreground mt-2">
          {credits.email} {credits.display_name && `(${credits.display_name})`}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credits.available_credits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Ready to use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credits.used_credits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {credits.total_credits > 0
                ? `${((credits.used_credits / credits.total_credits) * 100).toFixed(1)}% of total`
                : 'No usage'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credits.total_credits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Lifetime total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credits.free_credits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Bonus received</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Grant Bonus Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <GrantCreditsForm userId={userId} />
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Last Purchase</p>
                <p className="font-medium">
                  {credits.last_purchase_at
                    ? formatDistanceToNow(new Date(credits.last_purchase_at), {
                        addSuffix: true,
                      })
                    : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Created</p>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(credits.created_at), { addSuffix: true })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <UserTransactionsTable transactions={transactions} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
