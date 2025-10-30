import { Skeleton } from '@/components/ui/skeleton';

/**
 * Hero Loading Component
 * Shows skeleton for home page hero section with carousel
 */
export function HeroLoading() {
  return (
    <section className="relative h-full bg-gradient-to-b from-background to-muted/30">
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16 flex items-center">
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-6 md:gap-8">
          <div className="w-full md:w-1/2 md:pr-8 text-center md:text-left space-y-6">
            <Skeleton className="h-12 w-full max-w-lg mx-auto md:mx-0" />
            <Skeleton className="h-6 w-full max-w-md mx-auto md:mx-0" />
            <Skeleton className="h-6 w-full max-w-md mx-auto md:mx-0" />
            
            <div className="flex flex-col space-y-3 sm:space-y-4">
              <Skeleton className="h-10 w-40 mx-auto md:mx-0" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          
          <div className="w-full md:w-1/2 relative">
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <div className="flex gap-2 justify-center">
                <Skeleton className="h-2 w-8 rounded-full" />
                <Skeleton className="h-2 w-8 rounded-full" />
                <Skeleton className="h-2 w-8 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

