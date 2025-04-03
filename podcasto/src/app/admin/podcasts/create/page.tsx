import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PodcastCreationForm } from '@/components/admin/podcast-creation-form-new';

export const metadata = {
  title: 'Create Podcast | Admin Dashboard | podcasto',
  description: 'Create a new podcast with custom settings',
};

export default async function CreatePodcastPage() {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login?callbackUrl=/admin/podcasts/create');
  }
  
  // Check if user has admin role
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  // If user is not an admin, redirect to unauthorized page
  if (!userRoles || userRoles.role !== 'admin') {
    redirect('/unauthorized');
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Create New Podcast</h1>
      </div>
      
      <PodcastCreationForm />
    </div>
  );
} 