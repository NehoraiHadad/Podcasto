'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  runEpisodeChecker,
  runPodcastScheduler,
  runGoogleAudioGenerator,
  runAllCronJobs,
  CronOperationResult
} from '@/lib/actions/admin-actions';
import { CronJobType, CRON_JOB_OPTIONS } from '../../cron-runner-constants';

interface UseCronRunnerOptions {
  initialJob?: CronJobType;
}

interface UseCronRunnerReturn {
  isRunning: boolean;
  lastRunTime: Date | null;
  lastResult: CronOperationResult | null;
  selectedJob: CronJobType;
  setSelectedJob: (job: CronJobType) => void;
  runJob: () => Promise<void>;
}

export function useCronRunner({
  initialJob = 'episode-checker'
}: UseCronRunnerOptions = {}): UseCronRunnerReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  const [lastResult, setLastResult] = useState<CronOperationResult | null>(null);
  const [selectedJob, setSelectedJob] = useState<CronJobType>(initialJob);

  const getJobLabel = (type: CronJobType) => {
    return CRON_JOB_OPTIONS.find(job => job.value === type)?.label || 'Unknown Job';
  };

  const runJob = async () => {
    setIsRunning(true);
    setLastResult(null);
    setLastRunTime(null);

    try {
      let result: CronOperationResult;
      const jobLabel = getJobLabel(selectedJob);
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
          result = { success: false, message: 'Invalid job type' };
      }

      setLastRunTime(new Date());
      setLastResult(result);

      if (result.success) {
        toast.success(`${jobLabel} completed successfully.`);
      } else {
        toast.error(`${jobLabel} failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error running CRON job:', error);
      toast.error(`Failed to run: ${errorMessage}`);
      setLastResult({ success: false, message: errorMessage });
    } finally {
      setIsRunning(false);
    }
  };

  return {
    isRunning,
    lastRunTime,
    lastResult,
    selectedJob,
    setSelectedJob,
    runJob
  };
}
