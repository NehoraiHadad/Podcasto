import { FormLoading } from '@/components/loading';

export default function AdminEditEpisodeLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <FormLoading fields={5} />
    </div>
  );
}
