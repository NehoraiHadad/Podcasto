import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Credit Balance Skeleton */}
      <div className="bg-muted/50 rounded-lg p-4 mb-6">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>

      {/* Podcast Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="flex flex-col h-full">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-16 w-16 rounded-md" />
              </div>
              <div className="flex gap-2 mt-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 pb-3">
              <Skeleton className="h-5 w-full" />
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-3">
              <Skeleton className="h-10 w-full" />
              <div className="flex gap-2 w-full">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
