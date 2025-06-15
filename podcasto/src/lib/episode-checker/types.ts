/**
 * Represents the aggregated results of checking multiple episodes.
 */
export interface EpisodeCheckResults {
  checked: number;
  timed_out: number;
  completed: number;
  processed: number;
  published: number;
  requires_processing: number; // Track how many were identified as needing processing
  errors: string[];
}

// Potentially add other shared types related to episode checking here later. 