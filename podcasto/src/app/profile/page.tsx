import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'My Profile | podcasto',
  description: 'Manage your profile and subscriptions',
};

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = await createServerSupabaseClient({ cookieStore });
  
  // Get authenticated user - more secure than getSession
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/auth/login?redirect=/profile');
  }
  
  // Format the user's creation date
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">My Profile</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">User Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-600">Joined on</p>
              <p className="font-medium">{joinDate}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">My Subscriptions</h2>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You don't have any active subscriptions yet</p>
            <Link 
              href="/podcasts" 
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Discover Podcasts
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive updates about new content</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Digest</p>
                <p className="text-sm text-gray-600">Receive a daily summary of news</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 