import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function EpisodeLoading() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-8">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-6">
                <Skeleton className="w-full md:w-64 h-64 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-1/3 mb-1" />
                  <Skeleton className="h-10 w-3/4 mb-2" />
                  <Skeleton className="h-5 w-1/2 mb-4" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full rounded-lg" />
              <div className="flex justify-between mt-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-8 w-1/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 