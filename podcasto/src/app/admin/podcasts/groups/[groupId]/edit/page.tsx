import { notFound } from 'next/navigation';
import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { getPodcastGroupWithLanguages } from '@/lib/db/api/podcast-groups';
import { PodcastGroupEditForm } from '@/components/admin/podcast-group-edit-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Edit Podcast Group | Admin Dashboard | Podcasto',
  description: 'Edit podcast group details',
};

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function EditPodcastGroupPage({ params }: PageProps) {
  // Ensure user is an admin
  await checkIsAdmin({ redirectOnFailure: true });

  // Wait for params to be resolved
  const { groupId } = await params;

  // Fetch the podcast group with all language variants
  const podcastGroup = await getPodcastGroupWithLanguages(groupId);

  if (!podcastGroup) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/podcasts?view=groups">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Edit Podcast Group</h1>
        <p className="text-muted-foreground mt-2">
          Update group details and manage language variants
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group Settings</CardTitle>
          <CardDescription>
            Edit the base title, description, and manage which language is set as primary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PodcastGroupEditForm podcastGroup={podcastGroup} />
        </CardContent>
      </Card>
    </div>
  );
}
