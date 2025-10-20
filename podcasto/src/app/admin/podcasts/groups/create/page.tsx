import { redirect } from 'next/navigation';

/**
 * DEPRECATED: This page has been replaced by the unified podcast creation form
 *
 * All podcasts are now created as groups by default. The unified form at
 * /admin/podcasts/create handles both single-language podcasts and multilingual
 * podcast groups.
 *
 * This page now redirects to the unified creation form.
 */
export default function CreatePodcastGroupPage() {
  redirect('/admin/podcasts/create');
}
