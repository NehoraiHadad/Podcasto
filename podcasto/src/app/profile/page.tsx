import { Metadata } from 'next';
import { requireAuth } from '@/lib/actions/user-actions';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserCreditsAction } from '@/lib/actions/credit/credit-core-actions';
import { ProfilePagePresenter } from '@/components/pages/profile-page-presenter';

export const metadata: Metadata = {
  title: 'My Profile | Podcasto',
  description: 'Manage your profile and subscriptions',
};

export const dynamic = 'force-dynamic';

/**
 * Protected profile page
 * Uses requireAuth to ensure the user is authenticated
 */
export default async function ProfilePage() {
  const user = await requireAuth();

  const userProfile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
    columns: {
      email_notifications: true,
    }
  });

  const emailNotificationsEnabled = userProfile?.email_notifications ?? true;

  // Fetch user credits
  const creditsResult = await getUserCreditsAction();
  const credits = creditsResult.success ? creditsResult.data : null;

  return (
    <ProfilePagePresenter
      user={user}
      emailNotificationsEnabled={emailNotificationsEnabled}
      credits={credits}
    />
  );
} 