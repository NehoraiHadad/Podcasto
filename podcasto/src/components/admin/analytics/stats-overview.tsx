'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsStats } from '@/lib/actions/admin/analytics-actions';
import {
  Users,
  UserPlus,
  TrendingUp,
  Mail,
  MailX,
  CreditCard,
  Zap,
  Radio,
} from 'lucide-react';

interface StatsOverviewProps {
  stats: AnalyticsStats;
}

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass?: string;
}

function MetricCard({ title, items }: { title: string; items: StatItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
              <span className={`font-semibold ${item.colorClass || ''}`}>
                {item.value}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const userMetrics: StatItem[] = [
    {
      label: 'Total Users',
      value: stats.userMetrics.totalUsers.toLocaleString(),
      icon: Users,
    },
    {
      label: 'Active Users (7d)',
      value: stats.userMetrics.activeUsers.toLocaleString(),
      icon: TrendingUp,
    },
    {
      label: 'New Users (This Month)',
      value: stats.userMetrics.newUsersThisMonth.toLocaleString(),
      icon: UserPlus,
    },
    {
      label: 'Users with Subscriptions',
      value: stats.userMetrics.usersWithSubscriptions.toLocaleString(),
      icon: Radio,
    },
  ];

  const engagementMetrics: StatItem[] = [
    {
      label: 'Avg Subscriptions/User',
      value: stats.engagementMetrics.averageSubscriptionsPerUser.toFixed(2),
      icon: TrendingUp,
    },
    {
      label: 'Avg Episodes/User',
      value: stats.engagementMetrics.averageEpisodesPerUser.toFixed(2),
      icon: Mail,
    },
    {
      label: 'Total Episodes Sent',
      value: stats.engagementMetrics.totalEpisodesSent.toLocaleString(),
      icon: Mail,
    },
  ];

  const emailMetrics: StatItem[] = [
    {
      label: 'Total Emails Sent',
      value: stats.emailHealthMetrics.totalEmailsSent.toLocaleString(),
      icon: Mail,
    },
    {
      label: 'Bounce Rate',
      value: `${stats.emailHealthMetrics.bounceRate}%`,
      icon: MailX,
      colorClass: stats.emailHealthMetrics.bounceRate > 5 ? 'text-red-600' : 'text-green-600',
    },
    {
      label: 'Complaint Rate',
      value: `${stats.emailHealthMetrics.complaintRate}%`,
      icon: MailX,
      colorClass:
        stats.emailHealthMetrics.complaintRate > 0.1 ? 'text-red-600' : 'text-green-600',
    },
  ];

  const creditMetrics: StatItem[] = [
    {
      label: 'Total Credits Sold',
      value: stats.creditMetrics.totalCreditsSold.toLocaleString(),
      icon: CreditCard,
    },
    {
      label: 'Credits Used',
      value: stats.creditMetrics.totalCreditsUsed.toLocaleString(),
      icon: Zap,
    },
    {
      label: 'Credits Available',
      value: stats.creditMetrics.totalCreditsAvailable.toLocaleString(),
      icon: CreditCard,
    },
    {
      label: 'Avg Credits/User',
      value: stats.creditMetrics.averageCreditsPerUser.toFixed(2),
      icon: Users,
    },
    {
      label: 'Usage Rate',
      value: `${stats.creditMetrics.creditUsageRate}%`,
      icon: TrendingUp,
      colorClass: stats.creditMetrics.creditUsageRate > 50 ? 'text-green-600' : '',
    },
  ];

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard title="User Metrics" items={userMetrics} />
      <MetricCard title="Engagement" items={engagementMetrics} />
      <MetricCard title="Email Health" items={emailMetrics} />
      <MetricCard title="Credits" items={creditMetrics} />
    </div>
  );
}
