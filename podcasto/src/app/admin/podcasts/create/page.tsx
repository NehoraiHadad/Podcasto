import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { AdminPodcastForm } from '@/components/podcasts/forms/compositions';

export const metadata = {
  title: 'Create Podcast | Admin Dashboard | Podcasto',
  description: 'Create a new podcast with full admin customization',
};

export const dynamic = 'force-dynamic';

/**
 * Admin Podcast Creation Page
 *
 * This page allows admins to create podcasts with full customization options.
 * Uses the new modular form architecture for better maintainability.
 *
 * Features:
 * - Full podcast configuration (format, style, advanced settings)
 * - Content source selection (Telegram or RSS)
 * - Episode scheduling and automation
 * - Image upload and management
 */
export default async function CreatePodcastPage() {
  // Ensure user is an admin
  await checkIsAdmin({ redirectOnFailure: true });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Create New Podcast</h1>
          <p className="text-muted-foreground mt-2">
            Configure your podcast with full admin controls
          </p>
        </div>
      </div>

      <AdminPodcastForm mode="create" />
    </div>
  );
}
