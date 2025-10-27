import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Coins } from 'lucide-react';

import { hasSeenWelcome, requireAuth } from '@/lib/actions/user-actions';
import WelcomePageContent from './welcome-content';

/**
 * Welcome page shown after successful user registration
 * Handles authentication and ensures the welcome experience
 * is only displayed once per user.
 */
export default async function WelcomePage() {
  const user = await requireAuth('/welcome');
  const welcomeStatus = await hasSeenWelcome(user.id);

  if (!welcomeStatus.success && welcomeStatus.error) {
    console.error('[WelcomePage] Failed to verify welcome status:', welcomeStatus.error);
  }

  if (welcomeStatus.success && welcomeStatus.hasSeen) {
    redirect('/');
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Coins className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <WelcomePageContent />
    </Suspense>
  );
}
