import { CardGridLoading } from '@/components/loading';

export default function AdminLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CardGridLoading count={6} columns={3} showHeader={true} />
    </div>
  );
}
