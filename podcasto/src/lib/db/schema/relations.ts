import { relations } from 'drizzle-orm';
import { podcasts } from './podcasts';
import { episodes } from './episodes';
import { episodeProcessingLogs } from './episode-processing-logs';
import { subscriptions } from './subscriptions';
import { sentEpisodes } from './sent-episodes';
import { podcastConfigs } from './podcast-configs';

// Define podcast relations
export const podcastsRelations = relations(podcasts, ({ many }) => ({
  episodes: many(episodes),
  subscriptions: many(subscriptions),
  podcastConfigs: many(podcastConfigs)
}));

// Define episode relations
export const episodesRelations = relations(episodes, ({ one, many }) => ({
  podcast: one(podcasts, {
    fields: [episodes.podcast_id],
    references: [podcasts.id]
  }),
  sentEpisodes: many(sentEpisodes),
  processingLogs: many(episodeProcessingLogs)
}));

// Define episode processing logs relations
export const episodeProcessingLogsRelations = relations(episodeProcessingLogs, ({ one }) => ({
  episode: one(episodes, {
    fields: [episodeProcessingLogs.episode_id],
    references: [episodes.id]
  })
}));

// Define subscription relations
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  podcast: one(podcasts, {
    fields: [subscriptions.podcast_id],
    references: [podcasts.id]
  })
}));

// Define sent episodes relations
export const sentEpisodesRelations = relations(sentEpisodes, ({ one }) => ({
  episode: one(episodes, {
    fields: [sentEpisodes.episode_id],
    references: [episodes.id]
  })
}));

// Define podcast configs relations
export const podcastConfigsRelations = relations(podcastConfigs, ({ one }) => ({
  podcast: one(podcasts, {
    fields: [podcastConfigs.podcast_id],
    references: [podcasts.id]
  })
})); 