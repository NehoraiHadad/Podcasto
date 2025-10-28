import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { podcastsApi, episodesApi } from '@/lib/db/api';
import { PodcastEditForm } from '@/components/podcasts/forms/compositions';
import { checkAdvancedPodcastAccessAction } from '@/lib/actions/subscription-actions';

// Force dynamic rendering because this page uses authentication (cookies)
export const dynamic = 'force-dynamic';

interface PodcastSettingsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PodcastSettingsPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const podcast = await podcastsApi.getPodcastById(resolvedParams.id);

  return {
    title: `Settings - ${podcast?.title || 'Podcast'} | Podcasto`,
    description: 'Manage your podcast settings',
  };
}

export default async function PodcastSettingsPage({ params }: PodcastSettingsPageProps) {
  const resolvedParams = await params;

  // Get authenticated user
  const user = await getUser();

  if (!user) {
    redirect('/auth/login?redirect=/podcasts/' + resolvedParams.id + '/settings');
  }

  // Fetch podcast with full configuration for edit form
  const podcast = await podcastsApi.getPodcastByIdWithConfig(resolvedParams.id);

  if (!podcast) {
    notFound();
  }

  // Verify ownership
  if (podcast.created_by !== user.id) {
    redirect('/unauthorized');
  }

  // Check if user has advanced access (determines available features)
  const accessCheck = await checkAdvancedPodcastAccessAction();
  const userType = accessCheck.hasAccess ? 'premium' : 'regular';

  // Get episode stats for format change warning
  const episodes = await episodesApi.getEpisodesByPodcastId(resolvedParams.id);
  const episodeStats = {
    total: episodes.length,
    published: episodes.filter(e => e.status === 'completed').length,
    pending: episodes.filter(e => e.status === 'pending' || e.status === 'processing').length,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{podcast.title}</h1>
        <p className="text-muted-foreground mt-1">
          Manage podcast settings and configuration
        </p>
      </div>

      <PodcastEditForm
        podcast={podcast}
        userType={userType}
        episodeStats={episodeStats}
      />
    </div>
  );
}
