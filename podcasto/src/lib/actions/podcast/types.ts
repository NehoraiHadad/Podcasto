// Export types from schemas for use throughout the application
// This file doesn't use 'use server' directive, so it can export non-async items

export type { 
  ActionResponse, 
  PodcastCreationData, 
  SimplePodcastData, 
  PodcastUpdateData 
} from './schemas'; 