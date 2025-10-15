'use client';

import { ErrorLayout } from '@/components/layout/error-layout';
import { ErrorBoundary } from '@/components/errors';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorLayout>
      <ErrorBoundary error={error} reset={reset} />
    </ErrorLayout>
  );
}
