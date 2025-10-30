import { DetailsLoading } from '@/components/loading';

export default function AdminPodcastDetailsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DetailsLoading showHeader={true} />
    </div>
  );
}
