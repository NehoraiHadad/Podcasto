import { Skeleton } from '@/components/ui/skeleton';

export default function WelcomeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <Skeleton className="h-6 w-32 mx-auto" />
      </div>
    </div>
  );
}

