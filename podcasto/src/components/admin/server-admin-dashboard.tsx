import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdminDashboardStats } from '@/lib/actions/admin-actions';
import { verifyAdminAccess } from '@/lib/utils/admin-utils';

/**
 * Server component for the admin dashboard
 * This component fetches data server-side and renders the dashboard
 * It also verifies that the user is an admin before rendering
 */
export async function ServerAdminDashboard() {
  // Opt out of caching for this component
  noStore();
  
  // Verify admin access - this will redirect if the user is not an admin
  await verifyAdminAccess();
  
  try {
    // Fetch dashboard data using server action
    const stats = await getAdminDashboardStats();

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Podcasts</CardTitle>
              <CardDescription>Manage your podcasts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPodcasts}</div>
              <p className="text-xs text-muted-foreground">Total podcasts</p>
            </CardContent>
            <CardFooter>
              <Link href="/admin/podcasts" className="w-full">
                <Button className="w-full">Manage Podcasts</Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Episodes</CardTitle>
              <CardDescription>Manage podcast episodes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEpisodes}</div>
              <p className="text-xs text-muted-foreground">Total episodes</p>
            </CardContent>
            <CardFooter>
              <Link href="/admin/episodes" className="w-full">
                <Button className="w-full">Manage Episodes</Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Total users</p>
            </CardContent>
            <CardFooter>
              <Link href="/admin/users" className="w-full">
                <Button className="w-full">Manage Users</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/podcasts/create">
                <Button className="w-full mb-2">Create New Podcast</Button>
              </Link>
              <Link href="/admin/podcasts/generate">
                <Button className="w-full mb-2" variant="outline">Generate Episodes</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in ServerAdminDashboard:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-semibold text-red-800">Error</h3>
        <p className="text-red-600">Failed to load dashboard data. Please try again later.</p>
        <p className="text-xs text-red-500 mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
} 