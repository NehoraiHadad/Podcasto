"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Podcast } from "@/lib/api/podcasts";

export function PodcastSearch() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch podcasts on component mount
  useEffect(() => {
    const fetchPodcasts = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("podcasts")
          .select("*");

        if (error) {
          console.error("Error fetching podcasts:", error);
          return;
        }

        if (data) {
          setPodcasts(data);
        }
      } catch (error) {
        console.error("Error fetching podcasts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPodcasts();
  }, []);

  // Rotate through podcast images
  useEffect(() => {
    if (podcasts.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === podcasts.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [podcasts]);

  return (
    <div className="w-full">
      <div className="relative z-10 rounded-2xl shadow-xl overflow-hidden h-[300px] sm:h-[350px] md:h-[400px]">
        {isLoading ? (
          <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
            <p className="text-gray-500">Loading podcasts...</p>
          </div>
        ) : podcasts.length > 0 ? (
          <div className="relative w-full h-full">
            {podcasts.map((podcast, index) => (
              <div
                key={podcast.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentImageIndex ? "opacity-100" : "opacity-0"
                }`}
              >
                {podcast.image_url ? (
                  <Image
                    src={podcast.image_url}
                    alt={podcast.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={index === 0}
                    className="object-cover"
                  />
                ) : (
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
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 sm:p-5 md:p-6">
                  <h3 className="text-white text-lg sm:text-xl font-bold">{podcast.title}</h3>
                  <p className="text-white/80 text-sm sm:text-base line-clamp-2">{podcast.description}</p>
                  <Link href={`/podcasts/${podcast.id}`} className="mt-2 inline-block">
                    <Button variant="secondary" size="sm">Listen Now</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full bg-white flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 mb-2">No podcasts found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 