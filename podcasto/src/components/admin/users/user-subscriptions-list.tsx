import { Suspense } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getUserSubscriptionsAction } from '@/lib/actions/admin/user-actions';
import { formatDistanceToNow } from 'date-fns';
import { Bell, BellOff, Globe } from 'lucide-react';

interface UserSubscriptionsListProps {
  userId: string;
}

interface Subscription {
  id: string;
  created_at: string;
  language_preference: string | null;
  email_notifications: boolean;
  podcast_id: string | null;
  podcast_title: string | null;
  podcast_description: string | null;
  cover_image: string | null;
}

function EmptyState({ message, detail }: { message: string; detail?: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        {detail && <p className="text-xs text-muted-foreground mt-1">{detail}</p>}
      </CardContent>
    </Card>
  );
}

async function SubscriptionsContent({ userId }: UserSubscriptionsListProps) {
  const result = await getUserSubscriptionsAction(userId);

  if (!result.success) {
    return <EmptyState message={result.error || 'Failed to load subscriptions'} />;
  }

  const subscriptions = result.data as Subscription[];

  if (!subscriptions?.length) {
    return <EmptyState message="No subscriptions yet" detail="User has not subscribed to any podcasts" />;
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((subscription) => (
        <Card key={subscription.id}>
          <CardContent className="p-6 flex gap-4">
            {subscription.cover_image ? (
              <Image
                src={subscription.cover_image}
                alt={subscription.podcast_title || 'Podcast cover'}
                width={80}
                height={80}
                className="rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                🎙️
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {subscription.podcast_title || 'Untitled Podcast'}
              </h3>
              {subscription.podcast_description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {subscription.podcast_description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {subscription.language_preference && (
                  <Badge variant="secondary" className="gap-1"><Globe className="w-3 h-3" />{subscription.language_preference}</Badge>
                )}
                <Badge variant={subscription.email_notifications ? 'default' : 'outline'} className="gap-1">
                  {subscription.email_notifications ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                  {subscription.email_notifications ? 'On' : 'Off'}
                </Badge>
                <Badge variant="outline">
                  {formatDistanceToNow(new Date(subscription.created_at), { addSuffix: true })}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-6 flex gap-4">
            <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function UserSubscriptionsList({ userId }: UserSubscriptionsListProps) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SubscriptionsContent userId={userId} />
    </Suspense>
  );
}
