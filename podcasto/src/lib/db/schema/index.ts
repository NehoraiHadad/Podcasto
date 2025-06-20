// Import and re-export all schema definitions with their correct names
import { podcasts } from './podcasts';
import { episodes } from './episodes';
import { subscriptions } from './subscriptions';
import { sentEpisodes } from './sent-episodes';
import { userRoles } from './user-roles';
import { podcastConfigs } from './podcast-configs';

// Export all schema objects
export {
  podcasts,
  episodes,
  subscriptions,
  sentEpisodes,
  userRoles,
  podcastConfigs
};

// Export relationships for use in queries
export * from './relations'; 