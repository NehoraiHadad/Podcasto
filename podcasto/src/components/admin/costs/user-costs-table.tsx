'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CostBreakdownBadge } from './cost-breakdown-badge';
import { Search, RefreshCw } from 'lucide-react';
import { recalculateUserCostsAdmin } from '@/lib/actions/cost';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatUserDate } from '@/lib/utils/date/client';
import { DATE_FORMATS } from '@/lib/utils/date/constants';

interface UserCost {
  userId: string;
  userDisplayName: string | null;
  totalCostUsd: string;
  aiTextCostUsd: string;
  aiImageCostUsd: string;
  aiTtsCostUsd: string;
  lambdaExecutionCostUsd: string;
  s3OperationsCostUsd: string;
  s3StorageCostUsd: string;
  emailCostUsd: string;
  sqsCostUsd: string;
  otherCostUsd: string;
  totalTokens: number;
  totalEmailsSent: number;
  totalS3Operations: number;
  storageMb: string;
  lambdaDurationSeconds: string;
  costCalculatedAt: Date | null;
  lastUpdated: Date;
}

interface UserCostsTableProps {
  users: UserCost[];
  grandTotalCost: number;
}

export function UserCostsTable({ users, grandTotalCost }: UserCostsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [recalculatingUserId, setRecalculatingUserId] = useState<string | null>(null);
  const router = useRouter();

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.userDisplayName?.toLowerCase().includes(searchLower) ||
      user.userId.toLowerCase().includes(searchLower)
    );
  });

  const handleRecalculate = async (userId: string) => {
    setRecalculatingUserId(userId);
    try {
      const result = await recalculateUserCostsAdmin(userId);
      if (result.success) {
        toast.success('User costs recalculated successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to recalculate costs');
      }
    } catch (error) {
      toast.error('Failed to recalculate costs');
      console.error(error);
    } finally {
      setRecalculatingUserId(null);
    }
  };

  // Calculate total AI cost
  const getTotalAICost = (user: UserCost) => {
    return (
      parseFloat(user.aiTextCostUsd) +
      parseFloat(user.aiImageCostUsd) +
      parseFloat(user.aiTtsCostUsd)
    ).toFixed(6);
  };

  // Calculate total AWS cost
  const getTotalAWSCost = (user: UserCost) => {
    return (
      parseFloat(user.lambdaExecutionCostUsd) +
      parseFloat(user.s3OperationsCostUsd) +
      parseFloat(user.s3StorageCostUsd) +
      parseFloat(user.emailCostUsd) +
      parseFloat(user.sqsCostUsd)
    ).toFixed(6);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold">Grand Total: </span>
          <span className="text-lg font-bold text-foreground">
            ${grandTotalCost.toFixed(4)}
          </span>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>AI Cost</TableHead>
              <TableHead>AWS Cost</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-left">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const lastUpdatedDisplay = formatUserDate(
                  user.lastUpdated,
                  DATE_FORMATS.DISPLAY_DATETIME
                );

                return (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {user.userDisplayName || 'User'}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {user.userId.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <CostBreakdownBadge
                        label="AI"
                        value={getTotalAICost(user)}
                        variant="ai"
                      />
                    </TableCell>
                    <TableCell>
                      <CostBreakdownBadge
                        label="AWS"
                        value={getTotalAWSCost(user)}
                        variant="aws"
                      />
                    </TableCell>
                    <TableCell>
                      <CostBreakdownBadge
                        label="Total"
                        value={user.totalCostUsd}
                        variant="total"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-mono">
                          {user.totalTokens.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">tokens</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {lastUpdatedDisplay || 'Never'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRecalculate(user.userId)}
                        disabled={recalculatingUserId === user.userId}
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${
                            recalculatingUserId === user.userId ? 'animate-spin' : ''
                          }`}
                        />
                        <span className="ml-2">Recalculate</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
}
