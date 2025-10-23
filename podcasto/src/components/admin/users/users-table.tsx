'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, CheckCircle, Shield, User } from 'lucide-react';
import type { UserListItem } from '@/lib/actions/admin/user-actions';

interface UsersTableProps {
  users: UserListItem[];
}

export function UsersTable({ users }: UsersTableProps) {
  const getEmailStatusBadge = (status: 'active' | 'bounced' | 'complained') => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'bounced':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Bounced
          </Badge>
        );
      case 'complained':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Complained
          </Badge>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge variant="default" className="bg-purple-600">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="outline">
        <User className="h-3 w-3 mr-1" />
        User
      </Badge>
    );
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No users found
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Credits</TableHead>
            <TableHead className="text-center">Subscriptions</TableHead>
            <TableHead className="text-center">Episodes</TableHead>
            <TableHead>Email Status</TableHead>
            <TableHead>Last Login</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/50">
              <TableCell>
                <Link
                  href={`/admin/users/${user.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {user.email}
                </Link>
              </TableCell>
              <TableCell>
                {user.displayName || (
                  <span className="text-muted-foreground italic">No name</span>
                )}
              </TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell className="text-right font-mono">
                {user.availableCredits !== null ? (
                  <span className="font-semibold">{user.availableCredits}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {user.subscriptionsCount > 0 ? (
                  <span className="font-medium">{user.subscriptionsCount}</span>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {user.episodesReceived > 0 ? (
                  <span className="font-medium">{user.episodesReceived}</span>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </TableCell>
              <TableCell>{getEmailStatusBadge(user.emailStatus)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {user.lastSignInAt
                  ? formatDistanceToNow(new Date(user.lastSignInAt), {
                      addSuffix: true,
                    })
                  : 'Never'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
