'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserDetailsData } from '@/lib/actions/admin/user-actions';
import { Coins, TrendingUp, TrendingDown, Gift, Settings } from 'lucide-react';
import Link from 'next/link';

interface UserCreditsSummaryProps {
  userId: string;
  credits: UserDetailsData['credits'];
}

export function UserCreditsSummary({ userId, credits }: UserCreditsSummaryProps) {
  if (!credits) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No credit data available</p>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      icon: Coins,
      label: 'Available',
      value: credits.available,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      icon: TrendingUp,
      label: 'Total',
      value: credits.total,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: TrendingDown,
      label: 'Used',
      value: credits.used,
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      icon: Gift,
      label: 'Free',
      value: credits.free,
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Credits
        </CardTitle>
        <Link href={`/admin/users/${userId}/credits`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Manage Credits
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
