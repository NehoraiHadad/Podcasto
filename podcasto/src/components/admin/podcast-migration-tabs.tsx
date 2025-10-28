import type { MigrationPodcast, MigrationPodcastGroup } from './podcast-migration-types';
import { PodcastMigrationTabsClient } from './podcast-migration-tabs-client';

interface PodcastMigrationTabsServerProps {
  podcasts: MigrationPodcast[];
  groups: MigrationPodcastGroup[];
}

/**
 * Server wrapper for the admin podcast migration tabs.
 *
 * Receives pre-fetched data from the page component and passes it to the
 * corresponding client component to avoid redundant client-side fetching.
 */
export function PodcastMigrationTabsServer({ podcasts, groups }: PodcastMigrationTabsServerProps) {
  return <PodcastMigrationTabsClient podcasts={podcasts} groups={groups} />;
}
