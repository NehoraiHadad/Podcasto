import { Metadata } from 'next';
import { getActivePodcastGroups } from '@/lib/db/api/podcast-groups';
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
  const podcastGroups = await getActivePodcastGroups();

  const searchQuery = resolvedSearchParams?.search?.toLowerCase() || '';
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

  return (
    <PodcastsPagePresenter
      podcastGroups={filteredGroups}
      searchQuery={searchQuery}
      searchParamValue={resolvedSearchParams?.search}
    />
  );
} 