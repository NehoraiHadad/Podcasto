import { MainLayout } from '@/components/layout/main-layout';
import { FormLoading } from '@/components/loading';

export default function CreatePodcastLoading() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <FormLoading fields={8} />
      </div>
    </MainLayout>
  );
}
