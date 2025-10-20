/**
 * Podcast Groups API
 *
 * Provides database operations for multilingual podcast groups
 */

// Export all types
export type {
  PodcastGroup,
  NewPodcastGroup,
  PodcastLanguage,
  NewPodcastLanguage,
  PodcastLanguageWithPodcast,
  PodcastGroupWithLanguages,
  CreatePodcastGroupData,
  AddLanguageVariantData
} from './types';

export type { UnifiedPodcastDisplay } from './queries';

// Export query functions
export {
  getPodcastGroupById,
  getPodcastGroupWithLanguages,
  getPodcastByGroupAndLanguage,
  getPodcastLanguagesByGroupId,
  getPrimaryLanguage,
  getAllPodcastGroups,
  getAllPodcastGroupsWithLanguages,
  languageExistsInGroup,
  getPodcastGroupByPodcastId,
  getActivePodcastGroups,
  getLegacyPodcasts,
  getAllPodcastsForDisplay
} from './queries';

// Export mutation functions
export {
  createPodcastGroup,
  updatePodcastGroup,
  deletePodcastGroup,
  addLanguageVariant,
  updateLanguageVariant,
  removeLanguageVariant,
  setPrimaryLanguage,
  linkPodcastToGroup,
  unlinkPodcastFromGroup
} from './mutations';
