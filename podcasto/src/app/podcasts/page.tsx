import { Metadata } from 'next';
import { getAllPodcasts } from '@/lib/db/api/podcasts';
import { PodcastsPagePresenter } from '@/components/pages/podcasts-page-presenter';

export const metadata: Metadata = {
  title: 'Podcasts | Podcasto',
  description: 'Discover daily news podcasts',
};

interface PodcastsPageProps {
  searchParams?: Promise<{ search?: string }>;
}

export default async function PodcastsPage({ searchParams }: PodcastsPageProps) {
  const resolvedSearchParams = await searchParams || {};
  const podcasts = await getAllPodcasts();

  const searchQuery = resolvedSearchParams?.search?.toLowerCase() || '';
  const filteredPodcasts = searchQuery
    ? podcasts.filter(
        (podcast) =>
          podcast.title.toLowerCase().includes(searchQuery) ||
          podcast.description?.toLowerCase().includes(searchQuery))
    : podcasts;

  return (
    <PodcastsPagePresenter
      podcasts={filteredPodcasts}
      searchQuery={searchQuery}
      searchParamValue={resolvedSearchParams?.search}
    />
  );
} 