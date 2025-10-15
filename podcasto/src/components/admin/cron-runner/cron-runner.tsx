'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { useCronRunner } from './hooks/use-cron-runner';
import { CRON_JOB_OPTIONS } from '../cron-runner-constants';
import {
  parseEpisodeCheckerResult,
  parsePodcastSchedulerResult,
  parseGoogleAudioGeneratorResult,
  parseFullCronResult
} from './utils/result-type-guards';
import { JobSelector } from './components/job-selector';
import { ResultAlert } from './components/result-alert';
import { LastRunFooter } from './components/last-run-footer';
import { EpisodeCheckerResultDetails } from '../episode-checker-result-details';
import { PodcastSchedulerResultDetails } from '../podcast-scheduler-result-details';
import { GoogleAudioGeneratorResultDetails } from '../google-audio-generator-result-details';
import { FullCronResultDetails } from '../full-cron-result-details';

export function CronRunner() {
  const { isRunning, lastRunTime, lastResult, selectedJob, setSelectedJob, runJob } =
    useCronRunner();

  const selectedJobOption = CRON_JOB_OPTIONS.find(job => job.value === selectedJob);

  // Parse results using type guard utilities
  const episodeCheckerDetails = selectedJob === 'episode-checker'
    ? parseEpisodeCheckerResult(lastResult)
    : null;
  const podcastSchedulerDetails = selectedJob === 'podcast-scheduler'
    ? parsePodcastSchedulerResult(lastResult)
    : null;
  const googleAudioGeneratorDetails = selectedJob === 'google-audio-generator'
    ? parseGoogleAudioGeneratorResult(lastResult)
    : null;
  const fullCronDetails = selectedJob === 'full-cron'
    ? parseFullCronResult(lastResult)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual CRON Runner</CardTitle>
        <CardDescription>
          Select and run scheduled tasks manually. Current:
          <span className="font-semibold"> {selectedJobOption?.label}</span>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedJobOption?.description}
          </p>
        </CardDescription>
        <JobSelector
          selectedJob={selectedJob}
          onJobChange={setSelectedJob}
          disabled={isRunning}
        />
      </CardHeader>

      <CardContent className="space-y-4">
        <Button onClick={runJob} disabled={isRunning} className="w-full sm:w-auto">
          {isRunning ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            selectedJobOption?.icon || <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {isRunning ? 'Running...' : `Run ${selectedJobOption?.label || 'Job'}`}
        </Button>

        {lastResult && (
          <ResultAlert result={lastResult}>
            {episodeCheckerDetails && (
              <EpisodeCheckerResultDetails
                results={episodeCheckerDetails.results}
                timestamp={episodeCheckerDetails.timestamp}
              />
            )}
            {podcastSchedulerDetails && (
              <PodcastSchedulerResultDetails
                results={podcastSchedulerDetails.results}
                timestamp={podcastSchedulerDetails.timestamp}
              />
            )}
            {googleAudioGeneratorDetails && (
              <GoogleAudioGeneratorResultDetails
                results={googleAudioGeneratorDetails.results}
                timestamp={googleAudioGeneratorDetails.timestamp}
              />
            )}
            {fullCronDetails && (
              <FullCronResultDetails
                results={fullCronDetails.results}
                timestamp={fullCronDetails.timestamp}
              />
            )}
          </ResultAlert>
        )}
      </CardContent>

      {lastRunTime && <LastRunFooter time={lastRunTime} />}
    </Card>
  );
}
