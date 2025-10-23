'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserDetailsData } from '@/lib/actions/admin/user-actions';
import { Rss, Mail, Podcast, Mic } from 'lucide-react';

interface UserActivitySummaryProps {
  activity: UserDetailsData['activity'];
}

export function UserActivitySummary({ activity }: UserActivitySummaryProps) {
  const activityStats = [
    {
      icon: Rss,
      label: 'Subscriptions',
      value: activity.subscriptionsCount,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      icon: Mail,
      label: 'Episodes Received',
      value: activity.episodesReceived,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      icon: Podcast,
      label: 'Podcasts Created',
      value: activity.podcastsCreated,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      icon: Mic,
      label: 'Episodes Generated',
      value: activity.episodesGenerated,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {activityStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col gap-3 rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground truncate">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
