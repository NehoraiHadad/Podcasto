'use client';

import { UserCreditTransaction } from '@/lib/actions/credit/credit-admin-actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface UserTransactionsTableProps {
  transactions: UserCreditTransaction[];
}

const transactionTypeColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  purchase: 'default',
  bonus: 'secondary',
  usage: 'destructive',
  subscription: 'default',
};

const transactionTypeLabels: Record<string, string> = {
  purchase: 'Purchase',
  bonus: 'Bonus',
  usage: 'Usage',
  subscription: 'Subscription',
};

export function UserTransactionsTable({ transactions }: UserTransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Balance After</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <Badge variant={transactionTypeColors[transaction.type] || 'default'}>
                  {transactionTypeLabels[transaction.type] || transaction.type}
                </Badge>
              </TableCell>
              <TableCell className={`text-right font-medium ${
                transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.amount >= 0 ? '+' : ''}
                {transaction.amount.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {transaction.balance_after.toLocaleString()}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {transaction.description || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
