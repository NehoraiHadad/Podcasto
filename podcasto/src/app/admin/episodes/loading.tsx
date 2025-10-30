import { TableLoading } from '@/components/loading';

export default function AdminEpisodesLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <TableLoading rows={10} columns={6} />
    </div>
  );
}
