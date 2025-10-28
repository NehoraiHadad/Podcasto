import { createServerClient } from '@/lib/auth';
import { NotificationSettingsForm } from '@/components/settings/notification-settings-form';
import { SubscriptionList } from '@/components/settings/subscription-list';
import type { Database } from '@/lib/supabase/types';
import { Separator } from '@/components/ui/separator';
import { requireAuth } from '@/lib/actions/user-actions';
import { MainLayout } from '@/components/layout/main-layout';

// Force dynamic rendering because this page uses authentication (cookies)
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Email Notifications - Podcasto',
  description: 'Manage your email notification preferences',
};

export default async function NotificationsSettingsPage() {
  const user = await requireAuth('/settings/notifications');
  const supabase = await createServerClient();

  const [
    { data: profile, error: profileError },
    { data: subscriptionRows, error: subscriptionsError },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('email_notifications')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('subscriptions')
      .select(
        `
        id,
        podcast_id,
        email_notifications,
        created_at,
        podcasts:podcast_id (
          id,
          title,
          description,
          cover_image
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
  ]);

  if (profileError) {
    console.error('Failed to load profile preferences', profileError);
  }

  const emailNotifications = profile?.email_notifications ?? true;

  type SubscriptionWithPodcast = Database['public']['Tables']['subscriptions']['Row'] & {
    podcasts: Pick<Database['public']['Tables']['podcasts']['Row'], 'id' | 'title' | 'description' | 'cover_image'> | null;
  };

  if (subscriptionsError) {
    console.error('Failed to load subscriptions', subscriptionsError);
  }

  const userSubscriptions = ((subscriptionRows ?? []) as SubscriptionWithPodcast[]).map(subscription => ({
    id: subscription.id,
    podcast_id: subscription.podcast_id,
    podcast_title: subscription.podcasts?.title ?? 'Unknown Podcast',
    podcast_description: subscription.podcasts?.description ?? null,
    cover_image: subscription.podcasts?.cover_image ?? null,
    email_notifications: subscription.email_notifications,
    created_at: subscription.created_at ? new Date(subscription.created_at) : null,
  }));

  return (
    <MainLayout>
      <div className="container max-w-4xl py-10">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Email Notifications</h1>
            <p className="text-muted-foreground mt-2">
              Manage your email notification preferences
            </p>
          </div>

          {/* Global notification toggle */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Global Settings</h2>
            <NotificationSettingsForm
              initialEnabled={emailNotifications}
              userEmail={user.email || ''}
            />
          </div>

          <Separator />

          {/* Per-podcast notification controls */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Podcast Subscriptions</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Control email notifications for each podcast individually. Turning off notifications for a specific podcast
              means you won't receive emails when new episodes are published.
            </p>
            <SubscriptionList subscriptions={userSubscriptions} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
