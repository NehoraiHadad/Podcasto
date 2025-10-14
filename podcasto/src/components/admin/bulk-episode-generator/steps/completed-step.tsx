'use client';

import { CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GenerationStats } from '../components/generation-stats';
import type { GenerationResults } from '../types';

interface CompletedStepProps {
  results: GenerationResults;
}

export function CompletedStep({ results }: CompletedStepProps) {
  const allSucceeded = results.failureCount === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {allSucceeded ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              Generation Completed Successfully
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Generation Completed with Issues
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenerationStats results={results} />

        {results.failureCount > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some episodes failed to generate. Check the episodes list for details.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
