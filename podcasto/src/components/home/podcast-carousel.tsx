import { getAllPodcasts } from '@/lib/db/api/podcasts';
import { PodcastCarouselClient } from './podcast-carousel-client';
import { unstable_noStore as noStore } from 'next/cache';

/**
 * Server component that fetches featured podcasts and renders the client carousel
 */
export async function PodcastCarousel() {
  // Opt out of caching for this component
  noStore();
  
  try {
    // Fetch podcasts using Drizzle API
    const podcasts = await getAllPodcasts();
    
    if (!podcasts || podcasts.length === 0) {
      return null; // Don't render anything if no podcasts
    }
    
    
    return <PodcastCarouselClient podcasts={podcasts} />;
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    return <div>Failed to load featured podcasts</div>;
  }
} 