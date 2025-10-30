import { MainLayout } from '@/components/layout/main-layout';
import { FormLoading } from '@/components/loading';

export default function ContactLoading() {
  return (
    <MainLayout>
      <div className="container mx-auto py-8 max-w-2xl">
        <FormLoading fields={4} />
      </div>
    </MainLayout>
  );
}

