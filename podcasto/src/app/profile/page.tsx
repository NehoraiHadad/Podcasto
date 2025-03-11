import { Metadata } from 'next';
import { MainLayout } from '@/components/layout/main-layout';

import { requireAuth } from "@/lib/actions/auth-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: 'My Profile | podcasto',
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
        </div>
      </div>
    </MainLayout>
  );
} 