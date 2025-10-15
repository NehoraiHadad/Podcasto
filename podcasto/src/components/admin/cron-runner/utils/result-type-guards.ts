import { CronOperationResult } from '@/lib/actions/admin-actions';
import {
  EpisodeCheckerDetailedResult,
  PodcastSchedulerDetailedResult,
  GoogleAudioGeneratorDetailedResult,
  FullCronDetailedResult
} from '../../cron-runner-constants';

export function parseEpisodeCheckerResult(lastResult: CronOperationResult | null) {
  if (!lastResult?.details || typeof lastResult.details !== 'object') return null;
  if (!('results' in lastResult.details) || !lastResult.details.results) return null;

  return {
    results: lastResult.details.results as EpisodeCheckerDetailedResult,
    timestamp: lastResult.details.timestamp as string | Date | null
  };
}

export function parsePodcastSchedulerResult(lastResult: CronOperationResult | null) {
  if (!lastResult?.details || typeof lastResult.details !== 'object') return null;
  if (!('results' in lastResult.details) || !Array.isArray(lastResult.details.results)) return null;

  return {
    results: lastResult.details.results as PodcastSchedulerDetailedResult,
    timestamp: lastResult.details.timestamp as string | Date | null
  };
}

export function parseGoogleAudioGeneratorResult(lastResult: CronOperationResult | null) {
  if (!lastResult?.details || typeof lastResult.details !== 'object') return null;
  if (!('processed' in lastResult.details) || !('errors' in lastResult.details) || !('results' in lastResult.details)) return null;

  return {
    results: lastResult.details as unknown as GoogleAudioGeneratorDetailedResult,
    timestamp: lastResult.details.timestamp as string | Date | null
  };
}

export function parseFullCronResult(lastResult: CronOperationResult | null) {
  if (!lastResult?.details || typeof lastResult.details !== 'object') return null;
  if (!('results' in lastResult.details) || !Array.isArray(lastResult.details.results)) return null;

  return {
    results: lastResult.details.results as FullCronDetailedResult,
    timestamp: lastResult.details.timestamp as string | Date | null
  };
}
