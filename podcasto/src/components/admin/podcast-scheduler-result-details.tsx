'use client';

import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { 
  PodcastSchedulerDetailedResult,
  PodcastSchedulerIndividualResult 
} from './cron-runner-constants';

interface PodcastSchedulerResultDetailsProps {
  results: PodcastSchedulerDetailedResult;
  timestamp?: string | Date | null;
}

// Sub-component for rendering a single podcast result item
function PodcastResultItem({ result }: { result: PodcastSchedulerIndividualResult }) {
  return (
    <div className="mb-2 border rounded p-2 text-sm bg-card">
      <div className="flex items-center gap-2">
        {result.success ? (
          <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
        )}
        <span className="font-medium truncate" title={result.podcastTitle}>{result.podcastTitle}</span>
      </div>
      <div className="mt-1 text-muted-foreground text-xs pl-5">
        {result.message}
      </div>
      {result.episodeId && (
        <div className="mt-1 text-xs pl-5">
          Episode ID: <span className="font-mono bg-muted px-1 rounded">{result.episodeId}</span>
        </div>
      )}
    </div>
  );
}

export function PodcastSchedulerResultDetails({ results, timestamp }: PodcastSchedulerResultDetailsProps) {
  const podcastResults = results;
  const episodesCreatedCount = podcastResults.filter(r => r.success).length;

  return (
    <div className="space-y-3 mt-4 border-t pt-4">
      <h4 className="text-sm font-semibold mb-1">Podcast Scheduler Results:</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div className="font-medium text-muted-foreground">Timestamp:</div>
        <div>
          {timestamp ? 
            new Date(timestamp as string).toLocaleString() : 
            'N/A'}
        </div>
        
        <div className="font-medium text-muted-foreground">Podcasts Checked:</div>
        <div>{podcastResults.length ?? 'N/A'}</div>
        
        <div className="font-medium text-muted-foreground">Episodes Triggered:</div>
        <div>
          <Badge variant={episodesCreatedCount > 0 ? "secondary" : "outline"} className="font-normal">
            {episodesCreatedCount ?? 'N/A'}
          </Badge>
        </div>
      </div>
          
      {podcastResults.length > 0 && (
        <div className="mt-3">
          <h5 className="text-sm font-medium mb-2">Individual Podcast Results:</h5>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {podcastResults.map((result, index) => (
              <PodcastResultItem key={result.podcastId || index} result={result} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 