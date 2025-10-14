'use client';

import { Loader2 } from 'lucide-react';

export function GeneratingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="text-center space-y-2">
        <p className="font-medium">Generating Episodes...</p>
        <p className="text-sm text-muted-foreground">
          This may take several minutes. Please wait.
        </p>
      </div>
    </div>
  );
}
