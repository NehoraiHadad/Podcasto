/**
 * Audio Error State Component
 * Error alert displayed when audio fails to load
 */

'use client';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface AudioErrorStateProps {
  error: string;
  audioUrl?: string;
  onRetry?: () => void;
}

export function AudioErrorState({ error, audioUrl, onRetry }: AudioErrorStateProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Audio Loading Error</AlertTitle>
      <AlertDescription>
        {error}
        {audioUrl && (
          <div className="mt-2 text-xs opacity-70 break-all">
            Audio URL: {audioUrl}
          </div>
        )}
        <Button variant="outline" className="mt-2" onClick={handleRetry}>
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
