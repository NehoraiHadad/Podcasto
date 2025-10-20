import { Metadata } from 'next';
import { getActivePodcastGroups, getLegacyPodcasts } from '@/lib/db/api/podcast-groups';
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

  // Fetch both podcast groups and legacy podcasts
  const [podcastGroups, legacyPodcasts] = await Promise.all([
    getActivePodcastGroups(),
    getLegacyPodcasts()
  ]);

  const searchQuery = resolvedSearchParams?.search?.toLowerCase() || '';

  // Filter podcast groups
  const filteredGroups = searchQuery
    ? podcastGroups.filter(
        (group) =>
          group.base_title.toLowerCase().includes(searchQuery) ||
          group.base_description?.toLowerCase().includes(searchQuery) ||
          group.languages.some(lang =>
            lang.title.toLowerCase().includes(searchQuery) ||
            lang.description?.toLowerCase().includes(searchQuery)
          ))
    : podcastGroups;

  // Filter legacy podcasts
  const filteredLegacy = searchQuery
    ? legacyPodcasts.filter(
        (podcast) =>
          podcast.title.toLowerCase().includes(searchQuery) ||
          podcast.description?.toLowerCase().includes(searchQuery)
      )
    : legacyPodcasts;

  return (
    <PodcastsPagePresenter
      podcastGroups={filteredGroups}
      legacyPodcasts={filteredLegacy}
      searchQuery={searchQuery}
      searchParamValue={resolvedSearchParams?.search}
    />
  );
} 