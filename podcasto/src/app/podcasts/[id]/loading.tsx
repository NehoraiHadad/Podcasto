import { MainLayout } from '@/components/layout/main-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function PodcastDetailsLoading() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Podcast Info */}
          <div className="md:w-1/3">
            <Skeleton className="h-64 w-full rounded-lg mb-4" />
            <Skeleton className="h-10 w-3/4 mb-2" />
            <Skeleton className="h-6 w-1/2 mb-6" />
            <Skeleton className="h-24 w-full mb-6" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Episodes List */}
          <div className="md:w-2/3">
            <Skeleton className="h-10 w-1/3 mb-6" />
            
            {/* Episode items */}
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="mb-6">
                <Skeleton className="h-16 w-full rounded-lg mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 