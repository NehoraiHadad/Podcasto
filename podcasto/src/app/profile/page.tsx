import { Metadata } from 'next';
import { requireAuth } from '@/lib/actions/user-actions';
import { createServerClient } from '@/lib/auth';
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

  const supabase = await createServerClient();

  const { data: userProfile, error } = await supabase
    .from('profiles')
    .select('email_notifications')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Failed to load profile email preferences', error);
  }

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