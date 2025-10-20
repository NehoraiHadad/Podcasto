// Import and re-export all schema definitions with their correct names
import { podcasts } from './podcasts';
import { podcastGroups } from './podcast-groups';
import { podcastLanguages } from './podcast-languages';
import { episodes } from './episodes';
import { episodeProcessingLogs } from './episode-processing-logs';
import { subscriptions } from './subscriptions';
import { sentEpisodes } from './sent-episodes';
import { userRoles } from './user-roles';
import { podcastConfigs } from './podcast-configs';
import { profiles } from './profiles';

// Export all schema objects
export {
  podcasts,
  podcastGroups,
  podcastLanguages,
  episodes,
  episodeProcessingLogs,
  subscriptions,
  sentEpisodes,
  userRoles,
  podcastConfigs,
  profiles
};

// Export relationships for use in queries
export * from './relations'; 