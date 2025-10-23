import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { PodcastMigrationTabs } from '@/components/admin/podcast-migration-tabs';

export const metadata = {
  title: 'Migrate Podcasts | Admin Dashboard | Podcasto',
  description: 'Merge podcasts into multilingual groups',
};

export const dynamic = 'force-dynamic';

export default async function MigratePodcastsPage() {
  // Ensure user is an admin
  await checkIsAdmin({ redirectOnFailure: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Podcast Groups</h1>
        <p className="text-muted-foreground mt-2">
          Create new podcast groups from multiple podcasts, or add legacy podcasts to existing groups.
          This allows users to switch between language variants seamlessly.
        </p>
      </div>

      <PodcastMigrationTabs />
    </div>
  );
}
