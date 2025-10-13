import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NotificationSettingsForm } from '@/components/settings/notification-settings-form';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const metadata = {
  title: 'Email Notifications - Podcasto',
  description: 'Manage your email notification preferences',
};

export default async function NotificationsSettingsPage() {
  const supabase = await createClient();
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

  return (
    <div className="container max-w-2xl py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Email Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Manage your email notification preferences
          </p>
        </div>

        <NotificationSettingsForm
          initialEnabled={emailNotifications}
          userEmail={user.email || ''}
        />
      </div>
    </div>
  );
}
