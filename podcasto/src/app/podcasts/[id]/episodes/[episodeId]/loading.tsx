import { MainLayout } from '@/components/layout/main-layout';
import { DetailsLoading } from '@/components/loading';

export default function EpisodeLoading() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <DetailsLoading showHeader={true} />
      </div>
    </MainLayout>
  );
} 