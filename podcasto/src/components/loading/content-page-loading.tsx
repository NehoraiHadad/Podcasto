import { Skeleton } from '@/components/ui/skeleton';

/**
 * Content Page Loading Component
 * Shows skeleton for static content pages like About, Contact
 */
export function ContentPageLoading() {
  return (
    <section className="relative h-full bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <Skeleton className="h-10 w-64 mx-auto mb-6" />
        
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-8 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </section>
  );
}

