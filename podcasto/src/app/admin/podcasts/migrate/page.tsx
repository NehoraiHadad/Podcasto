import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { PodcastMigrationTool } from '@/components/admin/podcast-migration-tool';

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
        <h1 className="text-3xl font-bold">Migrate Podcasts to Groups</h1>
        <p className="text-muted-foreground mt-2">
          Merge multiple language variants of the same podcast into a single podcast group.
          This allows users to switch between languages seamlessly.
        </p>
      </div>

      <PodcastMigrationTool />
    </div>
  );
}
