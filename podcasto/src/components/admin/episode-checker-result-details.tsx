'use client';

import { Badge } from '@/components/ui/badge';
import { EpisodeCheckerDetailedResult } from './cron-runner-constants'; // For the specific result type

interface EpisodeCheckerResultDetailsProps {
  results: EpisodeCheckerDetailedResult;
  timestamp?: string | Date | null;
}

export function EpisodeCheckerResultDetails({ results, timestamp }: EpisodeCheckerResultDetailsProps) {
  return (
    <div className="space-y-2 mt-4 border-t pt-4">
      <h4 className="text-sm font-semibold mb-2">Episode Checker Results:</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="font-medium text-muted-foreground">Timestamp:</div>
        <div>
          {timestamp ? 
            new Date(timestamp as string).toLocaleString() : 
            'N/A'}
        </div>
        
        <div className="font-medium text-muted-foreground">Checked:</div>
        <div>{results.checked ?? 'N/A'}</div>
        
        <div className="font-medium text-muted-foreground">Timed Out:</div>
        <div>
          <Badge variant={results.timed_out > 0 ? "destructive" : "outline"} className="font-normal">
            {results.timed_out ?? 'N/A'}
          </Badge>
        </div>
        
        <div className="font-medium text-muted-foreground">Completed (Audio Found):</div>
        <div>
          <Badge variant="outline" className="font-normal">
            {results.completed ?? 'N/A'}
          </Badge>
        </div>
        
        <div className="font-medium text-muted-foreground">Processed (AI Tasks):</div>
        <div>
          <Badge variant={results.processed > 0 ? "secondary" : "outline"} className="font-normal">
            {results.processed ?? 'N/A'}
          </Badge>
        </div>
      </div>
      
      {results.errors?.length > 0 && (
        <div className="mt-4">
          <h5 className="text-sm font-medium mb-1 text-destructive">Errors:</h5>
          <ul className="text-sm space-y-1 list-disc list-inside text-destructive">
            {results.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 