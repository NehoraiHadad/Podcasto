import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { CreatePodcastForm } from '@/components/podcasts/create-podcast-form';
import { getUserCreditsAction } from '@/lib/actions/credit/credit-core-actions';

export const metadata: Metadata = {
  title: 'Create Podcast | Podcasto',
  description: 'Create a new podcast from Telegram content',
};

export default async function CreatePodcastPage() {
  // Get authenticated user
  const user = await getUser();

  if (!user) {
    redirect('/auth/login?redirect=/podcasts/create');
  }

  // Get user credits
  const creditsResult = await getUserCreditsAction();
  const userCredits = creditsResult.success ? creditsResult.data.available_credits : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create Podcast</h1>
        <p className="text-muted-foreground mt-1">
          Transform Telegram news into engaging audio podcasts
        </p>
      </div>

      {/* Credit Warning if low */}
      {userCredits < 10 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Low credits:</strong> You have {userCredits} credits.
            Episode generation requires 10 credits. Consider purchasing more credits to generate episodes.
          </p>
        </div>
      )}

      <CreatePodcastForm userCredits={userCredits} />
    </div>
  );
}
