import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { SystemSettingsManager } from '@/components/admin/system-settings-manager';

export const metadata = {
  title: 'System Settings | Admin Dashboard | Podcasto',
  description: 'Manage system-wide settings and configuration',
};

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  // Ensure user is an admin
  await checkIsAdmin({ redirectOnFailure: true });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure system-wide settings including credits, features, and limits
        </p>
      </div>

      <SystemSettingsManager />
    </div>
  );
}
