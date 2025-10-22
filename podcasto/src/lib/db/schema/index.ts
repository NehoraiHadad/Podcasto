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
import { costTrackingEvents } from './cost-tracking-events';
import { episodeCosts } from './episode-costs';
import { dailyCostSummary } from './daily-cost-summary';
import { monthlyCostSummary } from './monthly-cost-summary';
import { costPricingConfig } from './cost-pricing-config';
import { userCosts } from './user-costs';
import { userCredits } from './user-credits';
import { creditTransactions } from './credit-transactions';
import { creditPackages } from './credit-packages';
import { userSubscriptions } from './user-subscriptions';
import { systemSettings } from './system-settings';
import { emailBounces } from './email-bounces';

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
  profiles,
  costTrackingEvents,
  episodeCosts,
  dailyCostSummary,
  monthlyCostSummary,
  costPricingConfig,
  userCosts,
  userCredits,
  creditTransactions,
  creditPackages,
  userSubscriptions,
  systemSettings,
  emailBounces
};

// Export relationships for use in queries
export * from './relations'; 