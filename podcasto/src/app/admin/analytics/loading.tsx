import { StatCardsLoading } from '@/components/loading';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminAnalyticsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-9 w-64 mb-8" />

      <div className="space-y-8">
        {/* Stats Overview */}
        <section>
          <StatCardsLoading count={8} columns={4} />
        </section>

        {/* User Growth Chart */}
        <section>
          <Skeleton className="h-80 w-full rounded-lg" />
        </section>

        {/* Top Podcasts */}
        <section>
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </section>
      </div>
    </div>
  );
}

