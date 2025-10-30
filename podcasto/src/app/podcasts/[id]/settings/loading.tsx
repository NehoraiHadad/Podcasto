import { MainLayout } from '@/components/layout/main-layout';
import { FormLoading } from '@/components/loading';

export default function PodcastSettingsLoading() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <FormLoading fields={6} />
      </div>
    </MainLayout>
  );
}
