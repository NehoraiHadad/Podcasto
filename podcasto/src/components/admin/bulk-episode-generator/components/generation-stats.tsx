'use client';

import type { GenerationResults } from '../types';

interface GenerationStatsProps {
  results: GenerationResults;
}

export function GenerationStats({ results }: GenerationStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center p-3 bg-muted rounded-md">
        <p className="text-2xl font-bold">{results.totalRequested}</p>
        <p className="text-xs text-muted-foreground">Requested</p>
      </div>
      <div className="text-center p-3 bg-green-50 rounded-md">
        <p className="text-2xl font-bold text-green-600">
          {results.successCount}
        </p>
        <p className="text-xs text-green-700">Succeeded</p>
      </div>
      <div className="text-center p-3 bg-red-50 rounded-md">
        <p className="text-2xl font-bold text-red-600">
          {results.failureCount}
        </p>
        <p className="text-xs text-red-700">Failed</p>
      </div>
    </div>
  );
}
