import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { podcastsApi, podcastConfigsApi } from '@/lib/db/api';
import { PodcastSettingsForm } from '@/components/podcasts/podcast-settings-form';

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

  // Fetch podcast
  const podcast = await podcastsApi.getPodcastById(resolvedParams.id);

  if (!podcast) {
    notFound();
  }

  // Verify ownership
  if (podcast.created_by !== user.id) {
    redirect('/unauthorized');
  }

  // Fetch podcast config
  const config = await podcastConfigsApi.getPodcastConfigByPodcastId(resolvedParams.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{podcast.title}</h1>
        <p className="text-muted-foreground mt-1">
          Manage podcast settings and configuration
        </p>
      </div>

      <PodcastSettingsForm
        podcast={podcast}
        config={config}
      />
    </div>
  );
}
