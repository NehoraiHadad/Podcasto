'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { runEpisodeChecker, runPodcastScheduler, runAllCronJobs, runGoogleAudioGenerator, CronOperationResult } from '@/lib/actions/admin-actions';
import {
  CronJobType,
  CRON_JOB_OPTIONS,
  EpisodeCheckerDetailedResult,
  PodcastSchedulerDetailedResult,
  GoogleAudioGeneratorDetailedResult,
  FullCronDetailedResult 
} from './cron-runner-constants';
import { EpisodeCheckerResultDetails } from './episode-checker-result-details';
import { PodcastSchedulerResultDetails } from './podcast-scheduler-result-details';
import { GoogleAudioGeneratorResultDetails } from './google-audio-generator-result-details';
import { FullCronResultDetails } from './full-cron-result-details';

export function CronRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  const [lastResult, setLastResult] = useState<CronOperationResult | null>(null);
  const [selectedJob, setSelectedJob] = useState<CronJobType>('episode-checker');

  const getJobLabel = (type: CronJobType) => {
    return CRON_JOB_OPTIONS.find(job => job.value === type)?.label || 'Unknown Job';
  };

  const handleRunCron = async () => {
    setIsRunning(true);
    setLastResult(null);
    setLastRunTime(null);
    const jobLabel = getJobLabel(selectedJob);
    
    try {
      let result: CronOperationResult;
      toast.info(`Running ${jobLabel}...`);
      
      switch (selectedJob) {
        case 'episode-checker':
          result = await runEpisodeChecker();
          break;
        case 'podcast-scheduler':
          result = await runPodcastScheduler();
          break;
        case 'google-audio-generator':
          result = await runGoogleAudioGenerator();
          break;
        case 'full-cron':
          result = await runAllCronJobs();
          break;
        default:
          result = { success: false, message: 'Invalid job type selected' }; 
      }
      
      setLastRunTime(new Date());
      setLastResult(result);
      
      if (result.success) {
        toast.success(`${jobLabel} completed successfully.`);
      } else {
        toast.error(`${jobLabel} failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`Error running CRON job ${jobLabel}:`, error);
      toast.error(`Failed to run ${jobLabel}: ${errorMessage}`);
      setLastResult({ success: false, message: errorMessage });
    } finally {
      setIsRunning(false);
    }
  };

  const selectedJobOption = CRON_JOB_OPTIONS.find(job => job.value === selectedJob);

  // Prepare details variables with proper typing before rendering
  let episodeCheckerDetails: { results: EpisodeCheckerDetailedResult, timestamp: string | Date | null } | null = null;
  let podcastSchedulerDetails: { results: PodcastSchedulerDetailedResult, timestamp: string | Date | null } | null = null;
  let googleAudioGeneratorDetails: { results: GoogleAudioGeneratorDetailedResult, timestamp: string | Date | null } | null = null;
  let fullCronDetails: { results: FullCronDetailedResult, timestamp: string | Date | null } | null = null;

  if (lastResult?.details && typeof lastResult.details === 'object') {
    const detailsTimestamp = lastResult.details.timestamp as string | Date | null; // Cast timestamp once
    
    if (selectedJob === 'episode-checker' && 'results' in lastResult.details && lastResult.details.results) {
      episodeCheckerDetails = {
        results: lastResult.details.results as EpisodeCheckerDetailedResult,
        timestamp: detailsTimestamp
      };
    } else if (selectedJob === 'podcast-scheduler' && 'results' in lastResult.details && Array.isArray(lastResult.details.results)) {
      podcastSchedulerDetails = {
        results: lastResult.details.results as PodcastSchedulerDetailedResult,
        timestamp: detailsTimestamp
      };
    } else if (selectedJob === 'google-audio-generator' && 'processed' in lastResult.details && 'errors' in lastResult.details && 'results' in lastResult.details) {
      googleAudioGeneratorDetails = {
        results: lastResult.details as unknown as GoogleAudioGeneratorDetailedResult,
        timestamp: detailsTimestamp
      };
    } else if (selectedJob === 'full-cron' && 'results' in lastResult.details && Array.isArray(lastResult.details.results)) {
      fullCronDetails = {
        results: lastResult.details.results as FullCronDetailedResult,
        timestamp: detailsTimestamp
      };
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual CRON Runner</CardTitle>
        <CardDescription>
          Select and run scheduled tasks manually. Current: 
          <span className="font-semibold">{selectedJobOption?.label}</span>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedJobOption?.description}
          </p>
        </CardDescription>
        <Select 
          value={selectedJob} 
          onValueChange={(value) => setSelectedJob(value as CronJobType)}
          disabled={isRunning}
        >
          <SelectTrigger className="w-full mt-4">
            <SelectValue placeholder="Select a job" />
          </SelectTrigger>
          <SelectContent>
            {CRON_JOB_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button onClick={handleRunCron} disabled={isRunning} className="w-full sm:w-auto">
          {isRunning ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            selectedJobOption?.icon || <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {isRunning ? 'Running...' : `Run ${selectedJobOption?.label || 'Job'}`}
        </Button>

        {lastResult && (
          <Alert variant={lastResult.success ? 'default' : 'destructive'}>
            {lastResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{lastResult.success ? 'Run Completed' : 'Run Failed'}</AlertTitle>
            <AlertDescription>
              {lastResult.message}
              
              {/* Render detail components using the prepared, typed variables */} 
              {episodeCheckerDetails && 
                <EpisodeCheckerResultDetails 
                  results={episodeCheckerDetails.results} 
                  timestamp={episodeCheckerDetails.timestamp} 
                />}
              
              {podcastSchedulerDetails && 
                <PodcastSchedulerResultDetails 
                  results={podcastSchedulerDetails.results} 
                  timestamp={podcastSchedulerDetails.timestamp} 
                />}

              {googleAudioGeneratorDetails && 
                <GoogleAudioGeneratorResultDetails 
                  results={googleAudioGeneratorDetails.results} 
                  timestamp={googleAudioGeneratorDetails.timestamp} 
                />}
              
              {fullCronDetails && 
                <FullCronResultDetails 
                  results={fullCronDetails.results} 
                  timestamp={fullCronDetails.timestamp} 
                />}

            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {lastRunTime && (
        <CardFooter className="text-xs text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" />
          Last run finished: {lastRunTime.toLocaleString()}
        </CardFooter>
      )}
    </Card>
  );
} 