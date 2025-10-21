import { getAllPodcastsForDisplay } from '@/lib/db/api/podcast-groups';
import { PodcastCarouselClient } from './podcast-carousel-client';
import { unstable_noStore as noStore } from 'next/cache';

/**
 * Server component that fetches featured podcasts and renders the client carousel
 * Uses optimized unified query for both podcast groups and legacy podcasts
 */
export async function PodcastCarousel() {
  // Opt out of caching for this component
  noStore();

  try {
    // Fetch all podcasts using optimized unified query
    const allPodcastsUnified = await getAllPodcastsForDisplay();

    if (allPodcastsUnified.length === 0) {
      return null; // Don't render anything if no podcasts
    }

    // Convert unified format to carousel-compatible format
    const carouselPodcasts = allPodcastsUnified.map(item => {
      if (item.type === 'group' && item.group_data) {
        // For groups, use the primary language podcast ID for navigation
        const primaryLang = item.group_data.languages.find(l => l.is_primary) || item.group_data.languages[0];
        return {
          id: primaryLang.podcast_id, // IMPORTANT: Use podcast_id not group id
          title: item.title,
          description: item.description,
          cover_image: item.cover_image,
          created_at: item.created_at,
          updated_at: item.updated_at,
          image_style: null,
          is_paused: false,
          created_by: null,
          podcast_group_id: item.id,
          language_code: primaryLang.language_code,
          migration_status: 'grouped' as const
        };
      } else {
        // Legacy podcast - use podcast_data
        return {
          id: item.podcast_data!.id,
          title: item.podcast_data!.title,
          description: item.podcast_data!.description,
          cover_image: item.podcast_data!.cover_image,
          created_at: item.podcast_data!.created_at,
          updated_at: item.podcast_data!.updated_at,
          image_style: item.podcast_data!.image_style,
          is_paused: item.podcast_data!.is_paused,
          created_by: item.podcast_data!.created_by,
          podcast_group_id: null,
          language_code: null,
          migration_status: 'legacy' as const
        };
      }
    });

    return <PodcastCarouselClient podcasts={carouselPodcasts} />;
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    return <div>Failed to load featured podcasts</div>;
  }
} 