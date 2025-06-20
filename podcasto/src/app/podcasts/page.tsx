import { Metadata } from 'next';
import { MainLayout } from '@/components/layout/main-layout';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAllPodcasts, Podcast } from '@/lib/db/api/podcasts';
import { PodcastImage } from '@/components/podcasts/podcast-image';
import { Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Podcasts | Podcasto',
  description: 'Discover daily news podcasts',
};

interface PodcastsPageProps {
  searchParams?: Promise<{ search?: string }>;
}

export default async function PodcastsPage({ searchParams }: PodcastsPageProps) {
  // Resolve searchParams promise
  const resolvedSearchParams = await searchParams || {};
  
  // Fetch podcasts from Supabase
  const podcasts = await getAllPodcasts();
  
  // Filter podcasts if search parameter is provided
  const searchQuery = resolvedSearchParams?.search?.toLowerCase() || '';
  const filteredPodcasts = searchQuery
    ? podcasts.filter(
        (podcast: Podcast) => 
          podcast.title.toLowerCase().includes(searchQuery) ||
          podcast.description?.toLowerCase().includes(searchQuery))
    : podcasts;
  
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
                defaultValue={resolvedSearchParams?.search || ''}
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
              {filteredPodcasts.length === 0 
                ? `No results found for "${resolvedSearchParams?.search}"` 
                : `Showing ${filteredPodcasts.length} result${filteredPodcasts.length === 1 ? '' : 's'} for "${resolvedSearchParams?.search}"`}
            </p>
            {filteredPodcasts.length === 0 && (
              <Link href="/podcasts">
                <Button variant="link" className="mt-2 text-primary">View all podcasts</Button>
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPodcasts.length > 0 ? (
            filteredPodcasts.map((podcast) => (
              <Card key={podcast.id} className="overflow-hidden border-border/60 card-hover">
                <div className="h-48 bg-muted relative">
                  <PodcastImage
                    imageUrl={podcast.cover_image}
                    title={podcast.title}
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-foreground">{podcast.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {podcast.episodes_count} episodes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80">{podcast.description}</p>
                </CardContent>
                <CardFooter>
                  <Link href={`/podcasts/${podcast.id}`} className="w-full">
                    <Button variant="outline" className="w-full">Listen Now</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
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