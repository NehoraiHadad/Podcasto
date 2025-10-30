import { FormLoading } from '@/components/loading';

export default function AdminCreatePodcastLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FormLoading fields={8} />
    </div>
  );
}
