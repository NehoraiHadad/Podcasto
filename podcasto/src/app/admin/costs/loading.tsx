import { TabsLoading } from '@/components/loading';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCostsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <TabsLoading tabs={5} contentHeight={500} />
    </div>
  );
}

