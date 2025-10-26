import { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/actions/user-actions';
import { getTransactionHistoryAction } from '@/lib/actions/credit';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatInTimezoneServer } from '@/lib/utils/date/server';
import { DEFAULT_TIMEZONE } from '@/lib/utils/date/constants';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, TrendingDown, TrendingUp, Gift, RefreshCw, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Force dynamic rendering because this page uses authentication
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Transaction History | Podcasto',
  description: 'View your credit transaction history',
};

interface TransactionIconProps {
  type: string;
  amount: number;
}

function TransactionIcon({ type, amount }: TransactionIconProps) {
  const isPositive = amount > 0;

  switch (type) {
    case 'purchase':
      return <CreditCard className="h-4 w-4 text-blue-600" />;
    case 'usage':
      return <TrendingDown className="h-4 w-4 text-orange-600" />;
    case 'bonus':
      return <Gift className="h-4 w-4 text-green-600" />;
    case 'refund':
      return <RefreshCw className="h-4 w-4 text-purple-600" />;
    case 'subscription':
      return <TrendingUp className="h-4 w-4 text-indigo-600" />;
    default:
      return isPositive
        ? <TrendingUp className="h-4 w-4 text-green-600" />
        : <TrendingDown className="h-4 w-4 text-red-600" />;
  }
}

function TransactionBadge({ type }: { type: string }) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
    purchase: { variant: 'default', label: 'Purchase' },
    usage: { variant: 'secondary', label: 'Usage' },
    bonus: { variant: 'outline', label: 'Bonus' },
    refund: { variant: 'outline', label: 'Refund' },
    subscription: { variant: 'default', label: 'Subscription' },
  };

  const config = variants[type] || { variant: 'secondary' as const, label: type };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * Transaction History Page
 * Displays paginated list of credit transactions with filtering
 */
export default async function TransactionHistoryPage() {
  await requireAuth();

  const transactionsResult = await getTransactionHistoryAction(100);

  if (!transactionsResult.success) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load transaction history: {transactionsResult.error}
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  const transactions = transactionsResult.data || [];

  const stats = {
    totalTransactions: transactions.length,
    totalPurchased: transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0),
    totalUsed: Math.abs(
      transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    ),
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/credits">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Credits
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground mt-1">
            View all your credit transactions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Transactions</CardDescription>
              <CardTitle className="text-3xl">{stats.totalTransactions}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Purchased</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                +{stats.totalPurchased}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Used</CardDescription>
              <CardTitle className="text-3xl text-orange-600">
                -{stats.totalUsed}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              Showing all transactions (most recent first)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found. Purchase credits to get started.
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance After</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => {
                      const isPositive = transaction.amount > 0;
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <TransactionIcon
                              type={transaction.type}
                              amount={transaction.amount}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatInTimezoneServer(transaction.created_at, DEFAULT_TIMEZONE, 'dd MMMM yyyy')}
                          </TableCell>
                          <TableCell>
                            <TransactionBadge type={transaction.type} />
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            <span className={isPositive ? 'text-green-600' : 'text-orange-600'}>
                              {isPositive ? '+' : ''}{transaction.amount}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {transaction.balance_after}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {transaction.description || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {transactions.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
