import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';

export default function PodcastNotFound() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Podcast Not Found</h1>
          <p className="text-xl text-gray-600 mb-8">
            The podcast you were looking for doesn't exist or has been removed.
          </p>
          <Link href="/podcasts">
            <Button size="lg">Back to Podcasts List</Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
} 