import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PodcastCarousel } from "@/components/home/podcast-carousel";
import { SearchInput } from "@/components/home/search-input";
import { getCurrentUser } from "@/lib/actions/user-actions";

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Get the authenticated user on the server using the new function
  const user = await getCurrentUser();

  return (
    <MainLayout>
      <section className="relative h-full bg-gradient-to-b from-background to-muted/30">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16 flex items-center">
          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-6 md:gap-8">
            <div className="w-full md:w-1/2 md:pr-8 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4">
                Your Podcast, Your Way
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-foreground/80 mb-6 sm:mb-8 max-w-lg mx-auto md:mx-0">
                Podcasto transforms news content from Telegram channels into professional podcasts, delivered directly to you.
              </p>
              <div className="flex flex-col space-y-3 sm:space-y-4">
                {!user && (
                  <Link href="/auth/register" className="inline-block">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full md:w-auto"
                    >
                      Register Now
                    </Button>
                  </Link>
                )}
                <div className="w-full">
                  <SearchInput />
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 relative">
              {/* Server component that fetches podcasts */}
              <PodcastCarousel />
              <div className="hidden md:block absolute -top-20 right-10 w-40 h-40 bg-primary/30 rounded-full filter blur-3xl opacity-50"></div>
              <div className="hidden md:block absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/30 rounded-full filter blur-3xl opacity-50"></div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
