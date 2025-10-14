'use client';

import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EpisodePreviewList } from '../components/episode-preview-list';
import type { PreviewData } from '../types';

interface PreviewStepProps {
  previewData: PreviewData;
}

export function PreviewStep({ previewData }: PreviewStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Episode Preview</CardTitle>
        <CardDescription>
          {previewData.totalEpisodes} episode{previewData.totalEpisodes !== 1 ? 's' : ''}{' '}
          will be created
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap text-sm">
          <Badge variant="secondary">
            Estimated time: {previewData.estimatedTime}
          </Badge>
          {previewData.batchConfiguration && previewData.batchConfiguration.requiresBatching && (
            <Badge variant="outline">
              {previewData.batchConfiguration.totalBatches} batch{previewData.batchConfiguration.totalBatches > 1 ? 'es' : ''} needed
            </Badge>
          )}
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {previewData.batchConfiguration && previewData.batchConfiguration.requiresBatching ? (
              <>
                This will be processed in <strong>{previewData.batchConfiguration.totalBatches} batches</strong> of up to{' '}
                <strong>{previewData.batchConfiguration.episodesPerBatch} episodes</strong> each, with a short delay between requests to respect API rate limits.
                Total time: <strong>{previewData.estimatedTime}</strong>.
              </>
            ) : (
              <>
                Episodes will be created in a single batch with a short delay between each to respect API rate limits.
              </>
            )}
            {' '}Please do not close this window during generation.
          </AlertDescription>
        </Alert>

        <EpisodePreviewList episodes={previewData.episodeDates} />
      </CardContent>
    </Card>
  );
}
