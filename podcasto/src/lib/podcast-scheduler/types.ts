export interface PodcastScheduleData {
  id: string;
  title: string;
  frequency: number;
  latestEpisodeDate: Date;
}

export interface PodcastSqlRow {
  podcast_id: string;
  podcast_title: string;
  frequency: string | number; // Keep original type flexibility from route.ts
  latest_episode_date: string | Date; // Keep original type flexibility from route.ts
} 