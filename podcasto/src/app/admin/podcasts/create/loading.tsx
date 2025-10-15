import { MainLayout } from '@/components/layout/main-layout';
import { FormLoading } from '@/components/loading';

export default function CreatePodcastLoading() {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FormLoading fields={8} />
      </div>
    </MainLayout>
  );
}
