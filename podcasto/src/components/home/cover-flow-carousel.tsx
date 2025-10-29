"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Podcast {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
}

interface CoverFlowCarouselProps {
  podcasts: Podcast[];
}

const CARD_WIDTH_DESKTOP = 300;
const CARD_HEIGHT_DESKTOP = 300;
const GAP_DESKTOP = 40;

const CARD_WIDTH_MOBILE = 240;
const CARD_HEIGHT_MOBILE = 240;
const GAP_MOBILE = 20;

export function CoverFlowCarousel({ podcasts }: CoverFlowCarouselProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const CARD_WIDTH = isMobile ? CARD_WIDTH_MOBILE : CARD_WIDTH_DESKTOP;
  const CARD_HEIGHT = isMobile ? CARD_HEIGHT_MOBILE : CARD_HEIGHT_DESKTOP;
  const GAP = isMobile ? GAP_MOBILE : GAP_DESKTOP;

  const [index, setIndex] = useState(Math.floor(podcasts.length / 2));

  const handleNext = () => setIndex((i) => Math.min(i + 1, podcasts.length - 1));
  const handlePrev = () => setIndex((i) => Math.max(i - 1, 0));

  const centerPosition = useMemo(() => {
    if (!isMounted) return 0;
    return window.innerWidth / 2 - CARD_WIDTH / 2;
  }, [isMounted, CARD_WIDTH]);

  if (podcasts.length === 0) return null;

  const currentPodcast = podcasts[index];

  return (
    <div className="bg-black py-16 sm:py-20 text-white overflow-hidden">
        <div className="relative w-full h-[350px] sm:h-[400px] flex items-center justify-center" style={{ perspective: '1000px' }}>
            <AnimatePresence>
              <motion.div
                  className="flex items-center"
                  style={{ transformStyle: 'preserve-3d' }}
                  initial={{ x: 0 }}
                  animate={{ x: `-${index * (CARD_WIDTH + GAP) - centerPosition}px` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                  {podcasts.map((podcast, i) => {
                      const isActive = i === index;
                      const distance = Math.abs(index - i);

                      return (
                          <motion.div
                              key={podcast.id}
                              className="relative flex-shrink-0"
                              style={{ width: CARD_WIDTH, height: CARD_HEIGHT, marginRight: GAP }}
                              animate={{
                                  scale: isActive ? 1.1 : 0.8,
                                  rotateY: distance * (i < index ? 45 : -45),
                                  z: isActive ? 0 : -150,
                                  opacity: isMounted ? Math.max(1 - distance * 0.2, isMobile ? (distance > 0 ? 0 : 1) : 0.2) : 0,
                              }}
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              onClick={() => setIndex(i)}
                          >
                              {podcast.cover_image && (
                                  <Image
                                      src={podcast.cover_image}
                                      alt={podcast.title}
                                      fill
                                      className="object-cover rounded-lg shadow-2xl cursor-pointer"
                                      style={{ filter: isActive ? 'brightness(1)' : 'brightness(0.6)' }}
                                      sizes="(max-width: 768px) 50vw, 300px"
                                      priority={i >= index - 1 && i <= index + 1}
                                  />
                              )}
                          </motion.div>
                      );
                  })}
              </motion.div>
            </AnimatePresence>
        </div>

        <div className="text-center mt-8 px-4 h-36 sm:h-32">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentPodcast.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <h3 className="text-2xl sm:text-3xl font-bold">{currentPodcast.title}</h3>
                    <p className="text-white/70 max-w-lg mx-auto mt-2 text-sm sm:text-base line-clamp-2">{currentPodcast.description}</p>
                    <Link href={`/podcasts/${currentPodcast.id}`} className="mt-6 inline-block">
                        <Button variant="secondary" size={isMobile ? 'default' : 'lg'}>
                            Listen Now
                        </Button>
                    </Link>
                </motion.div>
            </AnimatePresence>
        </div>

        <div className="flex justify-center gap-4 mt-8">
            <Button onClick={handlePrev} disabled={index === 0}>Previous</Button>
            <Button onClick={handleNext} disabled={index === podcasts.length - 1}>Next</Button>
        </div>
    </div>
  );
}
