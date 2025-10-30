import { getCachedPodcastsForDisplay } from "@/lib/db/api/podcast-groups";
import { Carousel as AppleCardsCarousel } from "@/components/ui/apple-cards-carousel";
import { Card } from "@/components/ui/apple-cards-carousel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

export async function AppleCardsSection() {
  // As requested, we'll fetch all podcasts for now.
  // TODO: Implement logic to fetch only "public" podcasts when the feature is available.
  const allPodcastsUnified = await getCachedPodcastsForDisplay();

  const cardsData = allPodcastsUnified.map(item => {
    const podcastId = item.type === 'group'
      ? item.group_data?.languages.find(l => l.is_primary)?.podcast_id || item.id
      : item.podcast_data?.id;

    return {
      src: item.cover_image || "/placeholder.png",
      title: item.title,
      description: item.description,
      id: podcastId
    };
  });

  const cards = cardsData.map((card, index) => (
    <Card
      key={card.id}
      card={{
        src: card.src,
        title: card.title,
        category: "Podcast", // Using a generic category for now
        content: (
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-b-2xl">
            <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">{card.title}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-3">
              {card.description}
            </p>
            <Button asChild size="sm" className="inline-block mt-4">
              <Link href={`/podcasts/${card.id}`}>Listen Now</Link>
            </Button>
          </div>
        )
      }}
      index={index}
    />
  ));

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 sm:mb-12">
          Explore Our Podcasts
        </h2>
        <AppleCardsCarousel items={cards} />
      </div>
    </section>
  );
}