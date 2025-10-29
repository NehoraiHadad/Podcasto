import { NotificationSettingsForm } from '@/components/settings/notification-settings-form';
import { SubscriptionList } from '@/components/settings/subscription-list';
import { Separator } from '@/components/ui/separator';
import { requireAuth } from '@/lib/actions/user-actions';
import { MainLayout } from '@/components/layout/main-layout';
import { subscriptionsApi } from '@/lib/db/api';

// Force dynamic rendering because this page uses authentication (cookies)
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Email Notifications - Podcasto',
  description: 'Manage your email notification preferences',
};

export default async function NotificationsSettingsPage() {
  const user = await requireAuth('/settings/notifications');
  const { emailNotifications, subscriptions } = await subscriptionsApi.getUserNotificationSettings(
    user.id
  );

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
            <SubscriptionList subscriptions={subscriptions} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
