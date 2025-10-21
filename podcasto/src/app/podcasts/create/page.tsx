import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { CreatePodcastForm } from '@/components/podcasts/create-podcast-form';
import { getUserCreditsAction } from '@/lib/actions/credit/credit-core-actions';
import { checkAdvancedPodcastAccessAction } from '@/lib/actions/subscription-actions';
import { UnifiedPodcastCreationForm } from '@/components/admin/unified-podcast-creation-form';
import { Crown, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

  // Check if user has access to advanced podcast creation
  const accessCheck = await checkAdvancedPodcastAccessAction();
  const hasAdvancedAccess = accessCheck.hasAccess;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              Create Podcast
              {hasAdvancedAccess && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium">
                  <Crown className="h-4 w-4" />
                  Premium
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              {hasAdvancedAccess
                ? 'Create advanced podcasts with multi-language support and full customization'
                : 'Transform Telegram news into engaging audio podcasts'}
            </p>
          </div>
        </div>

        {/* Premium Access Info */}
        {hasAdvancedAccess && (
          <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  Advanced Features Unlocked
                  {accessCheck.accessReason === 'subscription' && ' (Premium Subscription)'}
                  {accessCheck.accessReason === 'credits' && ` (${accessCheck.totalCredits} Credits)`}
                </p>
                <ul className="text-sm text-purple-700 dark:text-purple-300 mt-2 space-y-1">
                  <li>• Multi-language podcast support</li>
                  <li>• Advanced audio configuration</li>
                  <li>• Custom speaker roles and styles</li>
                  <li>• Podcast groups creation</li>
                </ul>
              </div>
            </div>
          </div>
        )}
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

      {/* Show advanced form for premium users, basic form for free users */}
      {hasAdvancedAccess ? (
        <UnifiedPodcastCreationForm />
      ) : (
        <>
          <CreatePodcastForm userCredits={userCredits} />

          {/* Upgrade CTA */}
          <div className="mt-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Unlock Advanced Podcast Creation
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Get access to multi-language support, advanced audio configuration, and more with a Premium plan or by purchasing 100+ credits.
                </p>
                <div className="flex gap-3">
                  <Link href="/credits">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Buy Credits
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="outline">
                      View Plans
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
