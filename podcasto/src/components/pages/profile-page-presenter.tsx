import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { User } from '@supabase/supabase-js';
import { Coins, ShoppingCart, History, Zap } from 'lucide-react';
import type { UserCreditsData } from '@/lib/actions/credit';

interface ProfilePagePresenterProps {
  user: User;
  emailNotificationsEnabled: boolean;
  credits: UserCreditsData | null;
}

/**
 * Presenter component for Profile Page
 * Receives user data and email notification state as props and renders UI
 * Pure Server Component - no data fetching or business logic
 */
export function ProfilePagePresenter({
  user,
  emailNotificationsEnabled,
  credits
}: ProfilePagePresenterProps) {
  const usagePercentage = credits && credits.total_credits > 0
    ? (credits.used_credits / credits.total_credits) * 100
    : 0;

  const episodesPossible = credits
    ? Math.floor(credits.available_credits / 10)
    : 0;

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-base">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">User ID</p>
                  <p className="text-base font-mono text-xs">{user.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Sign In</p>
                  <p className="text-base">
                    {new Date(user.last_sign_in_at || '').toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credits Section */}
          <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-600" />
                Credit Balance
              </CardTitle>
              <CardDescription>
                Manage your credits and track usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {credits ? (
                <>
                  <div className="text-center py-4">
                    <div className="text-5xl font-bold text-yellow-600">
                      {credits.available_credits}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Available Credits
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Usage</span>
                      <span className="font-medium">
                        {credits.used_credits} / {credits.total_credits} used
                      </span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 mt-4">
                    <Zap className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="text-gray-700">You can create </span>
                      <span className="font-bold text-blue-700">{episodesPossible} episodes</span>
                      <span className="text-gray-700"> (10 credits each)</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link href="/credits" className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Buy Credits
                      </Button>
                    </Link>
                    <Link href="/credits/history" className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <History className="h-4 w-4 mr-2" />
                        History
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Coins className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Loading credit information...</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Manage your email notification preferences for new episodes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Email notifications are currently{' '}
                    <span className={emailNotificationsEnabled ? 'text-green-600' : 'text-red-600'}>
                      {emailNotificationsEnabled ? 'enabled' : 'disabled'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {emailNotificationsEnabled
                      ? 'You will receive emails when new episodes are published from podcasts you subscribe to'
                      : 'You will not receive email notifications for new episodes'}
                  </p>
                </div>
                <Link href="/settings/notifications">
                  <Button>
                    Manage Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
