"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Podcast } from "@/lib/db/api/podcasts";
import { getBestImageUrl } from "@/lib/utils/image-url-utils";

// Fallback component for when image is not available or fails to load
function PodcastImageFallback() {
  return (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
      <svg
        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-400"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
          clipRule="evenodd"
        ></path>
      </svg>
    </div>
  );
}

interface PodcastCarouselClientProps {
  podcasts: Podcast[];
}

/**
 * Client component that displays podcasts in a carousel
 * Receives data from the server component
 */
export function PodcastCarouselClient({ podcasts }: PodcastCarouselClientProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Required minimum swipe distance in pixels
  const minSwipeDistance = 50;

  const goToPrevious = useCallback(() => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? podcasts.length - 1 : prevIndex - 1
    );
  }, [podcasts.length]);

  const goToNext = useCallback(() => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === podcasts.length - 1 ? 0 : prevIndex + 1
    );
  }, [podcasts.length]);

  // Rotate through podcast images
  useEffect(() => {
    if (podcasts.length <= 1) return;

    const interval = setInterval(() => {
      goToNext();
    }, 5000); // Changed to 5 seconds for better user experience

    return () => clearInterval(interval);
  }, [podcasts, goToNext]);

  const handleImageError = (podcastId: string) => {
    setFailedImages(prev => ({ ...prev, [podcastId]: true }));
  };

  // Handle touch events for swipe gestures
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Go directly to a specific slide
  const goToSlide = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (podcasts.length === 0) {
    return (
      <div className="w-full rounded-2xl shadow-xl overflow-hidden h-[300px] sm:h-[350px] md:h-[400px] bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No podcasts found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        className="relative z-10 rounded-2xl shadow-xl overflow-hidden h-[300px] sm:h-[350px] md:h-[400px]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative w-full h-full">
          {podcasts.map((podcast, index) => (
            <div
              key={podcast.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === currentImageIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {podcast.cover_image && getBestImageUrl(podcast.cover_image) && !failedImages[podcast.id] ? (
                <Image
                  src={getBestImageUrl(podcast.cover_image)!}
                  alt={podcast.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  // Preload first 3 images for smooth carousel rotation
                  // This is a Next.js best practice for carousels
                  priority={index < 3}
                  className="object-cover"
                  onError={() => handleImageError(podcast.id)}
                  // quality defaults to 75 from next.config.ts
                />
              ) : (
                <PodcastImageFallback />
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <h3 className="text-white text-lg sm:text-xl font-bold">{podcast.title}</h3>
                <p className="text-white/80 text-sm sm:text-base line-clamp-2">{podcast.description}</p>
                <Link href={`/podcasts/${podcast.id}`} className="mt-2 inline-block">
                  <Button variant="secondary" size="sm">Listen Now</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        {/* Carousel indicators moved to bottom */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {podcasts.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentImageIndex 
                  ? "bg-white w-6" 
                  : "bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 