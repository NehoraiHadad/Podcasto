import { MainLayout } from '@/components/layout/main-layout';
import { DetailsLoading } from '@/components/loading';

export default function EpisodeDetailsLoading() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DetailsLoading showHeader={true} />
      </div>
    </MainLayout>
  );
}
