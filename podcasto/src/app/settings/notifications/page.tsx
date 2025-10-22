import { createServerClient } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NotificationSettingsForm } from '@/components/settings/notification-settings-form';
import { SubscriptionList } from '@/components/settings/subscription-list';
import { db, subscriptions, podcasts, profiles } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Email Notifications - Podcasto',
  description: 'Manage your email notification preferences',
};

export default async function NotificationsSettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
    columns: {
      email_notifications: true,
    }
  });

  const emailNotifications = profile?.email_notifications ?? true;

  // Fetch user subscriptions with podcast details
  const userSubscriptions = await db
    .select({
      id: subscriptions.id,
      podcast_id: subscriptions.podcast_id,
      podcast_title: podcasts.title,
      podcast_description: podcasts.description,
      cover_image: podcasts.cover_image,
      email_notifications: subscriptions.email_notifications,
      created_at: subscriptions.created_at,
    })
    .from(subscriptions)
    .innerJoin(podcasts, eq(subscriptions.podcast_id, podcasts.id))
    .where(eq(subscriptions.user_id, user.id))
    .orderBy(subscriptions.created_at);

  return (
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
  );
}
