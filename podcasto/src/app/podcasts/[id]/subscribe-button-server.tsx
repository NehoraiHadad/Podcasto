import { isUserSubscribed } from '@/lib/actions/subscription';
import { SubscribeForm } from './subscribe-form';
import { SessionService } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface SubscribeButtonServerProps {
  podcastId: string;
}

export async function SubscribeButtonServer({ podcastId }: SubscribeButtonServerProps) {
  const user = await SessionService.getUser();

  // Check subscription status server-side
  const isSubscribed = await isUserSubscribed(
    { podcastId },
    { user }
  );

  let emailNotificationsEnabled = true; // Default for non-authenticated users

  if (user) {
    const userProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, user.id),
      columns: {
        email_notifications: true,
      }
    });

    emailNotificationsEnabled = userProfile?.email_notifications ?? true;
  }

  return (
    <SubscribeForm
      podcastId={podcastId}
      initialIsSubscribed={isSubscribed}
      emailNotificationsEnabled={emailNotificationsEnabled}
    />
  );
}