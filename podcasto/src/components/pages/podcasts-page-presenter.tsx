import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MainLayout } from '@/components/layout/main-layout';
import { GroupedPodcastCard } from '@/components/podcasts/grouped-podcast-card';
import { PodcastCard } from '@/components/podcasts/podcast-card';
import { Search } from 'lucide-react';
import type { UnifiedPodcastDisplay } from '@/lib/db/api/podcast-groups';

interface PodcastsPagePresenterProps {
  podcasts: UnifiedPodcastDisplay[];
  searchQuery: string;
  searchParamValue?: string;
}

/**
 * Presenter component for Podcasts Page
 * Receives unified podcasts data and search state as props
 * Pure Server Component - no data fetching or business logic
 */
export function PodcastsPagePresenter({
  podcasts,
  searchQuery,
  searchParamValue
}: PodcastsPagePresenterProps) {
  const totalCount = podcasts.length;
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Discover Podcasts</h1>
          <p className="text-xl text-foreground/80 mb-8">
            Listen to daily news podcasts on topics that interest you
          </p>
          <div className="max-w-md mx-auto">
            <form action="/podcasts" method="get" className="relative">
              <Input
                type="search"
                name="search"
                placeholder="Search podcasts..."
                className="pl-10 pr-4 py-2 text-left bg-background/80 backdrop-blur-sm border-border/60 focus:border-primary/40 focus:ring-primary/20"
                defaultValue={searchParamValue || ''}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5 text-muted-foreground" />
              </div>
              <Button type="submit" className="sr-only">Search</Button>
            </form>
          </div>
        </div>

        {searchQuery && (
          <div className="mb-8 text-center">
            <p className="text-muted-foreground">
              {totalCount === 0
                ? `No results found for "${searchParamValue}"`
                : `Showing ${totalCount} result${totalCount === 1 ? '' : 's'} for "${searchParamValue}"`}
            </p>
            {totalCount === 0 && (
              <Link href="/podcasts">
                <Button variant="link" className="mt-2 text-primary">View all podcasts</Button>
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {totalCount > 0 ? (
            podcasts.map((item) => {
              if (item.type === 'group' && item.group_data) {
                return (
                  <GroupedPodcastCard
                    key={`group-${item.id}`}
                    podcastGroup={item.group_data}
                  />
                );
              } else if (item.type === 'legacy' && item.podcast_data) {
                return (
                  <PodcastCard
                    key={`legacy-${item.id}`}
                    podcast={item.podcast_data}
                  />
                );
              }
              return null;
            })
          ) : (
            <div className="col-span-3 text-center py-12">
              <p className="text-xl text-muted-foreground">No podcasts found. Please try again later.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
