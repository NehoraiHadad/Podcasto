import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getUserActivityAction } from '@/lib/actions/admin/user-actions';
import { formatDistanceToNow } from 'date-fns';
import { CreditCard, Mail, Activity } from 'lucide-react';

interface UserActivityFeedProps {
  userId: string;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

const getActivityIcon = (type: string) => {
  const icons = {
    credit_transaction: <CreditCard className="w-4 h-4" />,
    episode_received: <Mail className="w-4 h-4" />,
  };
  return icons[type as keyof typeof icons] || <Activity className="w-4 h-4" />;
};

const getActivityBadgeVariant = (type: string): 'default' | 'secondary' | 'outline' => {
  const variants = {
    credit_transaction: 'secondary' as const,
    episode_received: 'default' as const,
  };
  return variants[type as keyof typeof variants] || 'outline';
};

async function ActivityContent({ userId }: UserActivityFeedProps) {
  const result = await getUserActivityAction(userId, 10);

  if (!result.success) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-destructive">{result.error || 'Failed to load activity'}</p>
        </CardContent>
      </Card>
    );
  }

  const activities = result.data as ActivityItem[];

  if (!activities?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground mt-1">User activity will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="relative">
          <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />

          <ul className="space-y-6">
            {activities.map((activity) => (
              <li key={activity.id} className="relative flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center z-10">
                  {getActivityIcon(activity.type)}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm">{activity.title}</h4>
                    <Badge variant={getActivityBadgeVariant(activity.type)} className="flex-shrink-0">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between gap-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function UserActivityFeed({ userId }: UserActivityFeedProps) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ActivityContent userId={userId} />
    </Suspense>
  );
}
