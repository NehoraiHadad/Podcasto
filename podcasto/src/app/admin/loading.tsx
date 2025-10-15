import { MainLayout } from '@/components/layout/main-layout';
import { CardGridLoading } from '@/components/loading';

export default function AdminLoading() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CardGridLoading count={6} columns={3} showHeader={true} />
      </div>
    </MainLayout>
  );
}
