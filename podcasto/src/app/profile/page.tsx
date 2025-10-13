import { Metadata } from 'next';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';

import { requireAuth } from "@/lib/actions/auth-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'My Profile | Podcasto',
  description: 'Manage your profile and subscriptions',
};

/**
 * Protected profile page
 * Uses requireAuth to ensure the user is authenticated
 * 
 * @returns Profile page component
 */
export default async function ProfilePage() {
  // This will redirect to login if the user is not authenticated
  const user = await requireAuth();

  // Fetch user's email notification preference
  const userProfile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
    columns: {
      email_notifications: true,
    }
  });

  const emailNotificationsEnabled = userProfile?.email_notifications ?? true;

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
                  <p className="text-base">{user.id}</p>
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
          
          <Card>
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Current Plan</p>
                  <p className="text-base">Free Plan</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Features</p>
                  <ul className="list-disc list-inside text-base">
                    <li>Basic podcast access</li>
                    <li>Standard audio quality</li>
                    <li>Limited downloads</li>
                  </ul>
                </div>
              </div>
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