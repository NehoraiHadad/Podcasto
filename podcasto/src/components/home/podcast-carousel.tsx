import { createClient } from '@/lib/supabase/server';
import { PodcastCarouselClient } from './podcast-carousel-client';

/**
 * Server component that fetches podcasts and passes them to a client component
 */
export async function PodcastCarousel() {
  // Fetch podcasts on the server
  const supabase = await createClient();
  const { data: podcasts, error } = await supabase
    .from('podcasts')
    .select('*');

  if (error) {
    console.error('Error fetching podcasts:', error);
    return <div>Error loading podcasts</div>;
  }

  // Pass the podcasts to the client component
  return <PodcastCarouselClient podcasts={podcasts || []} />;
} 