import { Metadata } from 'next';
import { getAllPodcastsForDisplay } from '@/lib/db/api/podcast-groups';
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

  // Fetch all podcasts in unified format (optimized single query)
  const allPodcasts = await getAllPodcastsForDisplay();

  const searchQuery = resolvedSearchParams?.search?.toLowerCase() || '';

  // Filter podcasts - works on unified format
  const filteredPodcasts = searchQuery
    ? allPodcasts.filter((item) => {
        // Search in title and description
        const titleMatch = item.title.toLowerCase().includes(searchQuery);
        const descMatch = item.description?.toLowerCase().includes(searchQuery);

        // For groups, also search in all language variants
        if (item.type === 'group' && item.group_data) {
          const langMatch = item.group_data.languages.some(
            lang =>
              lang.title.toLowerCase().includes(searchQuery) ||
              lang.description?.toLowerCase().includes(searchQuery)
          );
          return titleMatch || descMatch || langMatch;
        }

        return titleMatch || descMatch;
      })
    : allPodcasts;

  return (
    <PodcastsPagePresenter
      podcasts={filteredPodcasts}
      searchQuery={searchQuery}
      searchParamValue={resolvedSearchParams?.search}
    />
  );
} 