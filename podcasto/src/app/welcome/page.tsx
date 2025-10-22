'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 p-4">
      <Card className="max-w-3xl w-full p-10 md:p-12 shadow-2xl border-2 border-purple-100 dark:border-purple-800/50">
        <div className="text-center">
          {/* Welcome Title with Logo */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center justify-center gap-3 flex-wrap">
              <span>Welcome to</span>
              <Image
                src="/podcasto-logo.webp"
                alt="Podcasto"
                width={180}
                height={48}
                quality={100}
                priority
                className="inline-block"
                style={{
                  width: 'auto',
                  height: '40px'
                }}
              />
            </h1>
          </div>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed max-w-xl mx-auto">
            Transform your Telegram content into professional AI-powered podcasts with natural conversations
          </p>

          {/* Credits Section */}
          {showCredits && !isLoading && credits !== null && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-2xl p-8 mb-10 shadow-lg">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-lg opacity-30"></div>
                  <Coins className="relative h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <span className="text-5xl font-bold text-green-700 dark:text-green-400">
                    {credits}
                  </span>
                  <span className="text-xl font-semibold text-green-600 dark:text-green-500 ml-2">
                    Credits
                  </span>
                </div>
              </div>

              <p className="text-green-800 dark:text-green-300 font-semibold mb-2 text-lg">
                🎉 Free credits added to your account!
              </p>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-800 dark:text-gray-200 bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 mt-4 border border-green-200 dark:border-green-800">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>
                  Each podcast episode costs <strong>10 credits</strong>
                </span>
              </div>

              {episodeCount > 0 && (
                <p className="text-sm text-green-700 dark:text-green-400 mt-4 font-semibold">
                  ✨ You can create up to <strong className="text-base">{episodeCount} episodes</strong> with your free credits!
                </p>
              )}
            </div>
          )}

          {/* Loading State */}
          {showCredits && isLoading && (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-8 mb-10">
              <div className="flex items-center justify-center gap-3">
                <Coins className="h-6 w-6 text-gray-400 animate-spin" />
                <span className="text-gray-600 dark:text-gray-300">Loading your credits...</span>
              </div>
            </div>
          )}

          {/* Getting Started Guide */}
          <div className="bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-8 mb-10 text-left shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <ArrowRight className="h-6 w-6 text-white" />
              </div>
              Getting Started
            </h2>

            <div className="space-y-5">
              <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20 dark:to-transparent border-l-4 border-purple-500">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                  1
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">Create a Podcast</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Configure your podcast with a Telegram channel as the content source
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-l-4 border-blue-500">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                  2
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">Generate Episodes</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    AI will process your Telegram content into professional audio with natural conversations
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-900/20 dark:to-transparent border-l-4 border-indigo-500">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                  3
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">Share & Subscribe</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Receive episodes via email or share with your audience
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={() => router.push('/podcasts/create')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
              size="lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Create Your First Podcast
            </Button>

            <Button
              onClick={() => router.push('/podcasts')}
              variant="outline"
              className="w-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300"
              size="lg"
            >
              Explore Podcasts
            </Button>
          </div>

          {/* Skip Link */}
          <button
            onClick={() => router.push('/')}
            className="mt-8 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline transition-colors"
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
