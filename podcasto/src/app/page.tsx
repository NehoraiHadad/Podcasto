import { MainLayout } from "@/components/layout/main-layout";
import { getCurrentUser } from "@/lib/actions/user-actions";
import { getCachedPodcastsForDisplay } from "@/lib/db/api/podcast-groups";
import { HeroSection } from "@/components/home/hero-section";
import { CoverFlowCarousel } from "@/components/home/cover-flow-carousel";
import { FeaturesSection } from "@/components/home/features-section";

// Define a type for the carousel podcast to ensure type safety
interface CarouselPodcast {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
}

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getCurrentUser();
  const podcasts = await getCachedPodcastsForDisplay();

  // Map and filter in a type-safe way
  const carouselPodcasts: CarouselPodcast[] = podcasts.map(item => {
    if (item.type === 'group' && item.group_data) {
      const primaryLang = item.group_data.languages.find(l => l.is_primary) || item.group_data.languages[0];
      return {
        id: primaryLang.podcast_id,
        title: item.title,
        description: item.description,
        cover_image: item.cover_image,
      };
    } else if (item.podcast_data) {
      return {
        id: item.podcast_data.id,
        title: item.podcast_data.title,
        description: item.podcast_data.description,
        cover_image: item.podcast_data.cover_image,
      };
    }
    return null;
  }).filter((p): p is CarouselPodcast => p !== null && p.cover_image !== null);


  return (
    <MainLayout>
      <div className="flex flex-col bg-black">
        <HeroSection user={user} />

        {carouselPodcasts.length > 0 && <CoverFlowCarousel podcasts={carouselPodcasts} />}

        <FeaturesSection />
      </div>
    </MainLayout>
  );
}
