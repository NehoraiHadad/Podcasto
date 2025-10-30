import { MainLayout } from "@/components/layout/main-layout";
import { HeroSection } from "@/components/home/hero-section";
import { AppleCardsSection } from "@/components/home/apple-cards-section";
import { FeaturesSection } from "@/components/home/features-section";
import { getCurrentUser } from "@/lib/actions/user-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

export const dynamic = 'force-dynamic';

const CallToAction = () => (
  <section className="py-12 bg-background">
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Start Your Podcast Journey?</h2>
      <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
        Join Podcasto today and turn your favorite content into a professional podcast in minutes.
      </p>
      <Button asChild size="lg">
        <Link href="/auth/register">Register Now</Link>
      </Button>
    </div>
  </section>
);

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <MainLayout>
      <HeroSection />
      {!user && <CallToAction />}
      <AppleCardsSection />
      <FeaturesSection />
    </MainLayout>
  );
}