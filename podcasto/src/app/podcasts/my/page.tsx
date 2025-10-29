import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, Podcast as PodcastIcon } from 'lucide-react';
import { getUser, createServerClient } from '@/lib/auth';
import { getUserCreditsAction, getEpisodeCostAction } from '@/lib/actions/credit/credit-core-actions';
import { Button } from '@/components/ui/button';
import { PodcastCardUser } from '@/components/podcasts';
import type { Database } from '@/lib/supabase/types';
import type { Podcast } from '@/lib/db/api/podcasts/types';
import { MainLayout } from '@/components/layout/main-layout';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Podcasts | Podcasto',
  description: 'Manage your podcasts and generate episodes',
};

interface SearchParams {
  status?: 'active' | 'paused';
}

interface MyPodcastsPageProps {
  searchParams?: Promise<SearchParams>;
}

export default async function MyPodcastsPage({ searchParams }: MyPodcastsPageProps) {
  // Get authenticated user
  const user = await getUser();

  if (!user) {
    redirect('/auth/login?redirect=/podcasts/my');
  }

  const resolvedSearchParams = await searchParams || {};
  const statusFilter = resolvedSearchParams.status;

  const supabase = await createServerClient();

  type PodcastWithEpisodeCount = Database['public']['Tables']['podcasts']['Row'] & {
    episodes: { count: number | null }[] | null;
  };

  const { data: podcastRows, error: podcastsError } = await supabase
    .from('podcasts')
    .select(
      `
        id,
        title,
        description,
        cover_image,
        image_style,
        is_paused,
        created_by,
        podcast_group_id,
        language_code,
        migration_status,
        auto_generation_enabled,
        last_auto_generated_at,
        next_scheduled_generation,
        created_at,
        updated_at,
        episodes(count)
      `
    )
    .eq('created_by', user.id)
    .order('created_at', { ascending: true });

  if (podcastsError) {
    console.error('Failed to load podcasts', podcastsError);
  }

  const typedPodcastRows = (podcastRows ?? []) as PodcastWithEpisodeCount[];

  const userPodcastsWithCounts = typedPodcastRows.map((podcastRow) => {
    const podcast: Podcast = {
      id: podcastRow.id,
      title: podcastRow.title,
      description: podcastRow.description,
      cover_image: podcastRow.cover_image,
      image_style: podcastRow.image_style,
      is_paused: podcastRow.is_paused,
      created_by: podcastRow.created_by,
      podcast_group_id: podcastRow.podcast_group_id,
      language_code: podcastRow.language_code || 'en', // Default to English if null (should not happen after migration)
      migration_status: podcastRow.migration_status,
      auto_generation_enabled: podcastRow.auto_generation_enabled,
      last_auto_generated_at: podcastRow.last_auto_generated_at
        ? new Date(podcastRow.last_auto_generated_at)
        : null,
      next_scheduled_generation: podcastRow.next_scheduled_generation
        ? new Date(podcastRow.next_scheduled_generation)
        : null,
      created_at: podcastRow.created_at ? new Date(podcastRow.created_at) : null,
      updated_at: podcastRow.updated_at ? new Date(podcastRow.updated_at) : null,
    };

    return {
      podcast,
      episodeCount: podcastRow.episodes?.[0]?.count ?? 0,
    };
  });

  // Apply status filter if specified
  const filteredPodcasts = statusFilter
    ? userPodcastsWithCounts.filter(item => {
        if (statusFilter === 'paused') return item.podcast.is_paused;
        if (statusFilter === 'active') return !item.podcast.is_paused;
        return true;
      })
    : userPodcastsWithCounts;

  // Get user credits and episode cost
  const [creditsResult, costResult] = await Promise.all([
    getUserCreditsAction(),
    getEpisodeCostAction()
  ]);

  const userCredits = creditsResult.success ? creditsResult.data.available_credits : 0;
  const episodeCost = costResult.success ? costResult.data : 10;

  const hasNoPodcasts = filteredPodcasts.length === 0;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Podcasts</h1>
            <p className="text-muted-foreground mt-1">
              Manage your podcasts and generate new episodes
            </p>
          </div>

          <Button asChild>
            <Link href="/podcasts/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Podcast
            </Link>
          </Button>
        </div>

        {/* Credit Balance */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Credits</p>
              <p className="text-2xl font-bold">{userCredits}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile">Manage Credits</Link>
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        {!hasNoPodcasts && (
          <div className="flex gap-2 mb-6">
            <Button
              variant={!statusFilter ? 'default' : 'outline'}
              size="sm"
              asChild
            >
              <Link href="/podcasts/my">All</Link>
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              asChild
            >
              <Link href="/podcasts/my?status=active">Active</Link>
            </Button>
            <Button
              variant={statusFilter === 'paused' ? 'default' : 'outline'}
              size="sm"
              asChild
            >
              <Link href="/podcasts/my?status=paused">Paused</Link>
            </Button>
          </div>
        )}

        {/* Podcast Grid or Empty State */}
        {hasNoPodcasts ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="rounded-full bg-muted p-6 mb-4">
              <PodcastIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No podcasts yet</h2>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {statusFilter
                ? `You don't have any ${statusFilter} podcasts. Try changing the filter.`
                : "Get started by creating your first podcast. Transform news into engaging audio content."}
            </p>
            {!statusFilter && (
              <Button asChild size="lg">
                <Link href="/podcasts/create">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Podcast
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPodcasts.map(({ podcast, episodeCount }) => (
              <PodcastCardUser
                key={podcast.id}
                podcast={podcast}
                episodeCount={episodeCount}
                userCredits={userCredits}
                episodeCost={episodeCost}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
