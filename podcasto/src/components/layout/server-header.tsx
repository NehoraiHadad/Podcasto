import { getAdminStatus } from '@/lib/auth/server';
import { ClientHeader } from './client-header';
import { unstable_noStore as noStore } from 'next/cache';

/**
 * Server component wrapper for the header
 * This component fetches the user and admin status on the server
 * and passes it to the client header component
 */
export async function ServerHeader() {
  // Opt out of caching for this component
  noStore();

  const { isAdmin, user } = await getAdminStatus();

  // Pass the admin status and user to the client component
  return <ClientHeader initialIsAdmin={isAdmin} initialUser={user} />;
}
