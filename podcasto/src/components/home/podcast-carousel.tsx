import { getActivePodcastGroups, getLegacyPodcasts } from '@/lib/db/api/podcast-groups';
import { PodcastCarouselClient } from './podcast-carousel-client';
import { unstable_noStore as noStore } from 'next/cache';

/**
 * Server component that fetches featured podcasts and renders the client carousel
 * Shows both podcast groups and legacy podcasts
 */
export async function PodcastCarousel() {
  // Opt out of caching for this component
  noStore();

  try {
    // Fetch both podcast groups and legacy podcasts
    const [podcastGroups, legacyPodcasts] = await Promise.all([
      getActivePodcastGroups(),
      getLegacyPodcasts()
    ]);

    // Convert podcast groups to a format compatible with the carousel
    // Use primary language for each group
    const groupPodcasts = podcastGroups.map(group => {
      const primaryLang = group.languages.find(l => l.is_primary) || group.languages[0];
      return {
        id: group.id,
        title: primaryLang.title,
        description: primaryLang.description,
        cover_image: primaryLang.cover_image || group.base_cover_image,
        created_at: group.created_at,
        updated_at: group.updated_at,
        image_style: null,
        is_paused: false,
        podcast_group_id: group.id,
        language_code: primaryLang.language_code,
        migration_status: 'grouped' as const
      };
    });

    // Combine both arrays
    const allPodcasts = [...groupPodcasts, ...legacyPodcasts];

    if (allPodcasts.length === 0) {
      return null; // Don't render anything if no podcasts
    }

    return <PodcastCarouselClient podcasts={allPodcasts} />;
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    return <div>Failed to load featured podcasts</div>;
  }
} 