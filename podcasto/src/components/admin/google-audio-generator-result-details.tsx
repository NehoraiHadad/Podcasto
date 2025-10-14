import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { GoogleAudioGeneratorDetailedResult, GoogleAudioGeneratorEpisodeResult } from './cron-runner-constants';

interface GoogleAudioGeneratorResultDetailsProps {
  results: GoogleAudioGeneratorDetailedResult;
  timestamp?: string | Date | null;
}

function EpisodeResultItem({ episode }: { episode: GoogleAudioGeneratorEpisodeResult }) {
  return (
    <div className="flex items-center justify-between text-sm border rounded p-2">
      <div className="flex items-center gap-2">
        {episode.success ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
        <span className="font-mono text-xs">{episode.episodeId}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={episode.success ? "default" : "destructive"} className="text-xs">
          {episode.success ? "Success" : "Failed"}
        </Badge>
        {episode.error && (
          <span className="text-xs text-red-600 max-w-48 truncate" title={episode.error}>
            {episode.error}
          </span>
        )}
        {episode.message && !episode.error && (
          <span className="text-xs text-muted-foreground max-w-48 truncate" title={episode.message}>
            {episode.message}
          </span>
        )}
      </div>
    </div>
  );
}

export function GoogleAudioGeneratorResultDetails({ results, timestamp }: GoogleAudioGeneratorResultDetailsProps) {
  return (
    <div className="space-y-3 mt-4 border-t pt-4">
      <h4 className="text-sm font-semibold mb-1">Google Audio Generator Results:</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div className="font-medium text-muted-foreground">Timestamp:</div>
        <div>
          {timestamp ? 
            new Date(timestamp as string).toLocaleString() : 
            'N/A'}
        </div>
        
        <div className="font-medium text-muted-foreground">Processed:</div>
        <div>
          <Badge variant="outline" className="font-normal">
            {results.processed ?? 0}
          </Badge>
        </div>
        
        <div className="font-medium text-muted-foreground">Errors:</div>
        <div>
          <Badge variant={results.errors > 0 ? "destructive" : "outline"} className="font-normal">
            {results.errors ?? 0}
          </Badge>
        </div>
      </div>

      {results.results && results.results.length > 0 && (
        <div className="mt-3">
          <h5 className="text-sm font-medium mb-2">Episode Results:</h5>
          <div className="space-y-1">
            {results.results.map((episode, index) => (
              <EpisodeResultItem key={episode.episodeId || index} episode={episode} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 