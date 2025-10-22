'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { togglePodcastEmailNotifications, type UserSubscription } from '@/lib/actions/subscription-management-actions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface SubscriptionListProps {
  subscriptions: UserSubscription[];
}

export function SubscriptionList({ subscriptions: initialSubscriptions }: SubscriptionListProps) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleToggle = async (subscriptionId: string, currentState: boolean) => {
    const newState = !currentState;

    // Optimistic update
    setSubscriptions(prev =>
      prev.map(sub =>
        sub.id === subscriptionId
          ? { ...sub, email_notifications: newState }
          : sub
      )
    );

    setLoadingStates(prev => ({ ...prev, [subscriptionId]: true }));

    const result = await togglePodcastEmailNotifications(subscriptionId, newState);

    setLoadingStates(prev => ({ ...prev, [subscriptionId]: false }));

    if (!result.success) {
      // Revert on error
      setSubscriptions(prev =>
        prev.map(sub =>
          sub.id === subscriptionId
            ? { ...sub, email_notifications: currentState }
            : sub
        )
      );

      toast({
        title: 'Error',
        description: result.error || 'Failed to update notification settings',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Updated',
        description: `Email notifications ${newState ? 'enabled' : 'disabled'} for this podcast`,
      });
    }
  };

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">You're not subscribed to any podcasts yet.</p>
        </CardContent>
      </Card>
    );
  }

  const activeCount = subscriptions.filter(sub => sub.email_notifications).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {activeCount} of {subscriptions.length} podcast{subscriptions.length !== 1 ? 's' : ''} sending notifications
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {subscriptions.map((subscription) => (
          <Card key={subscription.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {subscription.cover_image && (
                  <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={subscription.cover_image}
                      alt={subscription.podcast_title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {subscription.podcast_title}
                      </h3>
                      {subscription.podcast_description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {subscription.podcast_description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={subscription.email_notifications ? 'default' : 'secondary'}>
                          {subscription.email_notifications ? (
                            <>
                              <Bell className="h-3 w-3 mr-1" />
                              Notifications ON
                            </>
                          ) : (
                            <>
                              <BellOff className="h-3 w-3 mr-1" />
                              Notifications OFF
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {loadingStates[subscription.id] && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      <Switch
                        checked={subscription.email_notifications}
                        onCheckedChange={() => handleToggle(subscription.id, subscription.email_notifications)}
                        disabled={loadingStates[subscription.id]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
