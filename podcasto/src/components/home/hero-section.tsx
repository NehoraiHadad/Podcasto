import { getCachedPodcastsForDisplay } from "@/lib/db/api/podcast-groups";
import { HeroParallax } from "@/components/ui/hero-parallax";
import { SearchInput } from "@/components/home/search-input";

export async function HeroSection() {
  const allPodcastsUnified = await getCachedPodcastsForDisplay();

  const products = allPodcastsUnified.map(item => ({
    title: item.title,
    link: `/podcasts/${item.type === 'group' ? item.group_data?.languages.find(l => l.is_primary)?.podcast_id || item.id : item.podcast_data?.id}`,
    thumbnail: item.cover_image || "/placeholder.png",
  }));

  return (
    <div className="relative">
      <HeroParallax products={products} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6">
          Your Personal Podcast Studio
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-white/80 mb-8 sm:mb-10 max-w-2xl mx-auto">
          Turn Telegram news into engaging podcasts, effortlessly.
        </p>
        <div className="max-w-md mx-auto">
          <SearchInput />
        </div>
      </div>
    </div>
  )
}