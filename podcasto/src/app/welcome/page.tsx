'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { getUserCreditsAction } from '@/lib/actions/credit/credit-core-actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Coins, Sparkles, ArrowRight, Zap } from 'lucide-react';

/**
 * Welcome page content component
 */
function WelcomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showCredits = searchParams.get('credits') === 'true';

  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (showCredits) {
      getUserCreditsAction()
        .then((result) => {
          if (result.success && result.data) {
            setCredits(result.data.available_credits);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [showCredits]);

  const episodeCount = credits ? Math.floor(credits / 10) : 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <Card className="max-w-2xl w-full p-8 shadow-xl">
        <div className="text-center">
          {/* Welcome Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <Sparkles className="h-20 w-20 text-yellow-500 animate-pulse" />
              <div className="absolute -top-2 -right-2">
                <Zap className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Welcome Title */}
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to Podcasto!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Transform your Telegram content into professional AI-powered podcasts
          </p>

          {/* Credits Section */}
          {showCredits && !isLoading && credits !== null && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 mb-8 shadow-sm">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Coins className="h-10 w-10 text-green-600" />
                <div className="text-left">
                  <span className="text-4xl font-bold text-green-700">
                    {credits}
                  </span>
                  <span className="text-xl font-semibold text-green-600 ml-2">
                    Credits
                  </span>
                </div>
              </div>

              <p className="text-green-700 font-medium mb-2">
                Free credits added to your account!
              </p>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-700 bg-white/50 rounded-lg p-3 mt-4">
                <Zap className="h-4 w-4 text-blue-600" />
                <span>
                  Each podcast episode costs <strong>10 credits</strong>
                </span>
              </div>

              {episodeCount > 0 && (
                <p className="text-sm text-green-600 mt-3 font-medium">
                  You can create up to <strong>{episodeCount} episodes</strong> with your free credits!
                </p>
              )}
            </div>
          )}

          {/* Loading State */}
          {showCredits && isLoading && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 mb-8">
              <div className="flex items-center justify-center gap-2">
                <Coins className="h-6 w-6 text-gray-400 animate-spin" />
                <span className="text-gray-600">Loading your credits...</span>
              </div>
            </div>
          )}

          {/* Getting Started Guide */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 text-left">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-purple-600" />
              Getting Started
            </h2>

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-800">Create a Podcast</p>
                  <p className="text-sm text-gray-600">
                    Configure your podcast with a Telegram channel as the content source
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-800">Generate Episodes</p>
                  <p className="text-sm text-gray-600">
                    AI will process your Telegram content into professional audio
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-800">Share & Subscribe</p>
                  <p className="text-sm text-gray-600">
                    Receive episodes via email or share with your audience
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/podcasts/create')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
              size="lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Create Your First Podcast
            </Button>

            <Button
              onClick={() => router.push('/podcasts')}
              variant="outline"
              className="w-full border-2 hover:bg-gray-50"
              size="lg"
            >
              Explore Podcasts
            </Button>
          </div>

          {/* Skip Link */}
          <button
            onClick={() => router.push('/podcasts')}
            className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Skip and explore later
          </button>
        </div>
      </Card>
    </div>
  );
}

/**
 * Welcome page shown after successful user registration
 * Displays free credits notification and guides user to next steps
 */
export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Coins className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <WelcomePageContent />
    </Suspense>
  );
}
