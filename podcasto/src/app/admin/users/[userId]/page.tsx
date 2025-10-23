import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { getUserDetailsAction } from '@/lib/actions/admin/user-actions';
import { UserProfileCard } from '@/components/admin/users/user-profile-card';
import { UserRoleManager } from '@/components/admin/users/user-role-manager';
import { UserCreditsSummary } from '@/components/admin/users/user-credits-summary';
import { UserActivitySummary } from '@/components/admin/users/user-activity-summary';
import { UserEmailHealth } from '@/components/admin/users/user-email-health';
import UserSubscriptionsList from '@/components/admin/users/user-subscriptions-list';
import UserActivityFeed from '@/components/admin/users/user-activity-feed';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: UserDetailPageProps): Promise<Metadata> {
  const { userId } = await params;
  const result = await getUserDetailsAction(userId);

  return {
    title: result.success && result.data
      ? `${result.data.email} | User Details | Podcasto Admin`
      : 'User Details | Podcasto Admin',
    description: 'View and manage user details, subscriptions, and activity',
  };
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

async function UserDetailsContent({ userId }: { userId: string }) {
  const result = await getUserDetailsAction(userId);

  if (!result.success || !result.data) {
    notFound();
  }

  const user = result.data;

  return (
    <div className="space-y-6">
      <UserProfileCard user={user} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserRoleManager userId={user.id} currentRole={user.role} userEmail={user.email} />
        {user.credits && <UserCreditsSummary userId={user.id} credits={user.credits} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserActivitySummary activity={user.activity} />
        <UserEmailHealth emailHealth={user.emailHealth} />
      </div>

      <Tabs defaultValue="subscriptions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="mt-6">
          <Suspense fallback={<LoadingSkeleton />}>
            <UserSubscriptionsList userId={userId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Suspense fallback={<LoadingSkeleton />}>
            <UserActivityFeed userId={userId} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  await checkIsAdmin({ redirectOnFailure: true });

  const { userId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/users">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Users
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Details</h1>
        <p className="text-muted-foreground">
          Manage user information, roles, credits, and activity
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <UserDetailsContent userId={userId} />
      </Suspense>
    </div>
  );
}
