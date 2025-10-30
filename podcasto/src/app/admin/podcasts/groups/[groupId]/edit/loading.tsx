import { FormLoading } from '@/components/loading';

export default function AdminEditPodcastGroupLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <FormLoading fields={6} />
    </div>
  );
}

