import { Metadata } from 'next';
import { requireAuth } from '@/lib/actions/user-actions';
import { getUserCreditsAction } from '@/lib/actions/credit/credit-core-actions';
import { ProfilePagePresenter } from '@/components/pages/profile-page-presenter';
import { subscriptionService } from '@/lib/services/subscriptions';

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

  const [emailPreferenceResult, creditsResult] = await Promise.all([
    subscriptionService.getEmailNotificationPreference(user.id),
    getUserCreditsAction(),
  ]);

  if (!emailPreferenceResult.success) {
    console.error(
      'Failed to load profile email preferences',
      emailPreferenceResult.error
    );
  }

  const emailNotificationsEnabled = emailPreferenceResult.success
    ? emailPreferenceResult.data
    : true;

  const credits = creditsResult.success ? creditsResult.data : null;

  return (
    <ProfilePagePresenter
      user={user}
      emailNotificationsEnabled={emailNotificationsEnabled}
      credits={credits}
    />
  );
}
