import React from 'react';
import { CalendarCheck, PlaySquare, Calendar } from 'lucide-react';

/**
 * Interface for the detailed results specifically from the episode checker job.
 */
export interface EpisodeCheckerDetailedResult {
  checked: number;
  timed_out: number;
  completed: number;
  processed: number;
  requires_processing: number;
  errors: string[];
}

/**
 * Interface for the result of a single podcast processed by the scheduler.
 */
export interface PodcastSchedulerIndividualResult {
  podcastId: string;
  podcastTitle: string;
  success: boolean;
  episodeId?: string;
  message: string;
  checkerResult?: EpisodeCheckerDetailedResult;
}

/**
 * Type alias for the array of results from the podcast scheduler job.
 */
export type PodcastSchedulerDetailedResult = PodcastSchedulerIndividualResult[];

/**
 * Interface for the result of a single job executed within the full cron run.
 */
export interface FullCronIndividualJobResult {
  job: string;
  success: boolean;
  status?: number; // Optional HTTP status if applicable
  result: Record<string, unknown>; // Generic result structure
  error?: string;
}

/**
 * Type alias for the array of results from the full cron job.
 */
export type FullCronDetailedResult = FullCronIndividualJobResult[];

/**
 * Union type for the different kinds of detailed results based on the job type.
 */
export type CronDetailedResultType = 
  | EpisodeCheckerDetailedResult 
  | PodcastSchedulerDetailedResult 
  | FullCronDetailedResult;

/**
 * Type defining the possible cron job identifiers.
 */
export type CronJobType = 'episode-checker' | 'podcast-scheduler' | 'full-cron';

/**
 * Interface defining the structure for cron job selection options.
 */
export interface CronJobOption {
  value: CronJobType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Array containing the configuration for each selectable cron job.
 */
export const CRON_JOB_OPTIONS: CronJobOption[] = [
  {
    value: 'episode-checker',
    label: 'Episode Checker',
    description: 'Check status of pending/completed episodes and trigger post-processing.',
    icon: <PlaySquare className="h-4 w-4" />
  },
  {
    value: 'podcast-scheduler',
    label: 'Podcast Scheduler',
    description: 'Check for podcasts needing new episodes based on frequency and generate them.',
    icon: <CalendarCheck className="h-4 w-4" />
  },
  {
    value: 'full-cron',
    label: 'Full CRON Job',
    description: 'Run all scheduled tasks sequentially (scheduler then checker).',
    icon: <Calendar className="h-4 w-4" />
  }
]; 