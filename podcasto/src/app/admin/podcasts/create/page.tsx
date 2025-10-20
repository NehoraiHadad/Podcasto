import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { UnifiedPodcastCreationForm } from '@/components/admin/unified-podcast-creation-form';

export const metadata = {
  title: 'Create Podcast | Admin Dashboard | Podcasto',
  description: 'Create a new podcast with optional multilingual support',
};

export const dynamic = 'force-dynamic';

/**
 * Unified Podcast Creation Page
 *
 * This page allows admins to create podcasts that are ALWAYS part of a podcast group.
 * The form defaults to a single language variant, but users can add more languages.
 *
 * Features:
 * - Single language by default (auto-fills group data)
 * - Add multiple languages as needed
 * - All podcasts are grouped from creation
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
            Create a podcast with one or more language variants
          </p>
        </div>
      </div>

      <UnifiedPodcastCreationForm />
    </div>
  );
}
