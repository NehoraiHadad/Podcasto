'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PodcastMigrationTool } from './podcast-migration-tool';
import { AddToExistingGroupTool } from './add-to-existing-group-tool';

/**
 * Podcast Migration Tabs Component
 *
 * Provides two tabs:
 * 1. Create New Group - Merge multiple podcasts into a new group
 * 2. Add to Existing - Add a legacy podcast to an existing group
 */
export function PodcastMigrationTabs() {
  return (
    <Tabs defaultValue="create" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="create">Create New Group</TabsTrigger>
        <TabsTrigger value="add">Add to Existing</TabsTrigger>
      </TabsList>

      <TabsContent value="create" className="mt-6">
        <PodcastMigrationTool />
      </TabsContent>

      <TabsContent value="add" className="mt-6">
        <AddToExistingGroupTool />
      </TabsContent>
    </Tabs>
  );
}
