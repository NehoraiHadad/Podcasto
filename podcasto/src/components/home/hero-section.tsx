"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type Container, type ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { SearchInput } from "./search-input";

interface HeroSectionProps {
  user: { id: string } | null;
}

export function HeroSection({ user }: HeroSectionProps) {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log("particles.js loaded", container);
  };

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: "#000000",
        },
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "repulse",
          },
        },
        modes: {
          repulse: {
            distance: 100,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: "#ffffff",
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "out",
          },
          random: true,
          speed: 0.5,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 80, // Reduced for performance on smaller screens
        },
        opacity: {
          value: 0.3,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 2 },
        },
      },
      detectRetina: true,
    }),
    [],
  );

  if (!init) {
    return null;
  }

  return (
    <section className="relative bg-black text-white h-screen flex items-center justify-center overflow-hidden">
      <Particles
        id="tsparticles"
        particlesLoaded={particlesLoaded}
        options={options}
        className="absolute inset-0 z-0"
      />
      <div className="absolute inset-0 z-10 bg-black/50" />
      <div className="relative z-20 text-center p-4">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-white"
          style={{
            textShadow: '0 0 15px rgba(138, 43, 226, 0.6), 0 0 25px rgba(138, 43, 226, 0.6)'
          }}
        >
          Your Podcast, Your Way
        </h1>
        <p className="text-md sm:text-lg text-white/80 mb-8 max-w-lg sm:max-w-xl mx-auto">
          Transforming Telegram channels into captivating podcasts. Discover, listen, and enjoy.
        </p>

        <div className="max-w-sm mx-auto mb-6">
          <SearchInput />
        </div>

        {!user && (
          <p className="text-white/70">
            New to Podcasto?{' '}
            <Link href="/auth/register" className="underline hover:text-white transition-colors">
              Start Here
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
