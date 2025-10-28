'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PodcastMigrationTool } from './podcast-migration-tool';
import { AddToExistingGroupTool } from './add-to-existing-group-tool';
import type { MigrationPodcast, MigrationPodcastGroup } from './podcast-migration-types';

interface PodcastMigrationTabsClientProps {
  podcasts: MigrationPodcast[];
  groups: MigrationPodcastGroup[];
}

/**
 * Client component for rendering the podcast migration workflow tabs.
 */
export function PodcastMigrationTabsClient({ podcasts, groups }: PodcastMigrationTabsClientProps) {
  return (
    <Tabs defaultValue="create" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="create">Create New Group</TabsTrigger>
        <TabsTrigger value="add">Add to Existing</TabsTrigger>
      </TabsList>

      <TabsContent value="create" className="mt-6">
        <PodcastMigrationTool podcasts={podcasts} />
      </TabsContent>

      <TabsContent value="add" className="mt-6">
        <AddToExistingGroupTool podcasts={podcasts} groups={groups} />
      </TabsContent>
    </Tabs>
  );
}
