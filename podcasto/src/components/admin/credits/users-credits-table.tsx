'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserWithCredits } from '@/lib/actions/credit/credit-admin-actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Gift } from 'lucide-react';
import { GrantCreditsDialog } from './grant-credits-dialog';
import { formatDistanceToNow } from 'date-fns';

interface UsersCreditsTableProps {
  users: UserWithCredits[];
  total: number;
  currentPage: number;
  pageSize: number;
}

export function UsersCreditsTable({
  users,
  total,
  currentPage,
  pageSize,
}: UsersCreditsTableProps) {
  const router = useRouter();
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleGrantClick = (userId: string) => {
    setSelectedUserId(userId);
    setGrantDialogOpen(true);
  };

  const handleGrantSuccess = () => {
    setGrantDialogOpen(false);
    setSelectedUserId(null);
    router.refresh();
  };

  const totalPages = Math.ceil(total / pageSize);

  if (users.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <p className="text-muted-foreground">No users with credits found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead className="text-right">Free Credits</TableHead>
                <TableHead>Last Purchase</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.display_name || '-'}</TableCell>
                  <TableCell className="text-right">
                    {user.available_credits.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.used_credits.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.free_credits.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {user.last_purchase_at
                      ? formatDistanceToNow(new Date(user.last_purchase_at), {
                          addSuffix: true,
                        })
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${user.user_id}/credits`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleGrantClick(user.user_id)}>
                          <Gift className="h-4 w-4 mr-2" />
                          Grant Bonus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, total)} of {total} users
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/admin/users/credits?page=${currentPage - 1}`)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/admin/users/credits?page=${currentPage + 1}`)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {selectedUserId && (
        <GrantCreditsDialog
          open={grantDialogOpen}
          onOpenChange={setGrantDialogOpen}
          userId={selectedUserId}
          onSuccess={handleGrantSuccess}
        />
      )}
    </>
  );
}
