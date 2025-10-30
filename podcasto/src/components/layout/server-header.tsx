import { unstable_noStore as noStore } from 'next/cache';
import { getAdminStatus } from '@/lib/auth';
import { ClientHeader } from './client-header';

/**
 * Server component wrapper for the header
 * This component fetches the user and admin status on the server
 * and passes it to the client header component
 */
export async function ServerHeader() {
  // Opt out of caching for this component
  noStore();

  const { isAdmin } = await getAdminStatus();

  // Pass the admin status to the client component
  return <ClientHeader initialIsAdmin={isAdmin} />;
}
