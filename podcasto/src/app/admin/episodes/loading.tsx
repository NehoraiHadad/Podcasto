import { MainLayout } from '@/components/layout/main-layout';
import { TableLoading } from '@/components/loading';

export default function AdminEpisodesLoading() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TableLoading rows={10} columns={6} />
      </div>
    </MainLayout>
  );
}
