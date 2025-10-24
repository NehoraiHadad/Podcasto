import Link from 'next/link';
import { format } from 'date-fns';
import { unstable_noStore as noStore } from 'next/cache';
import { podcastsApi } from '@/lib/db/api';
import { getAllPodcastGroupsWithLanguages } from '@/lib/db/api/podcast-groups';
import { Pause, Globe, Edit } from 'lucide-react';
import { getLanguageFlag, getLanguageName } from '@/lib/utils/language-utils';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PodcastActionsMenu } from './action-menus';

// Define the expected podcast type for the component
interface Podcast {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  is_paused?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string;
  timestamp?: string;
  podcast_group_id?: string | null;
  language_code?: string | null;
  [key: string]: string | number | boolean | null | undefined;
}

interface ServerPodcastsListProps {
  viewMode?: 'all' | 'groups';
}

/**
 * Server component that fetches and displays a list of podcasts
 * Supports two view modes:
 * - 'all': Shows all podcasts (legacy view)
 * - 'groups': Shows grouped podcasts with language variants
 */
export async function ServerPodcastsList({ viewMode = 'all' }: ServerPodcastsListProps) {
  // Opt out of caching for this component
  noStore();

  try {
    if (viewMode === 'groups') {
      return <PodcastGroupsView />;
    }

    return <AllPodcastsView />;
  } catch (error) {
    console.error('Error in ServerPodcastsList:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-semibold text-red-800">Error</h3>
        <p className="text-red-600">Failed to load podcasts. Please try again later.</p>
        <p className="text-xs text-red-500 mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
}

/**
 * All Podcasts View - Shows individual podcasts with language indicators
 */
async function AllPodcastsView() {
  const drizzlePodcasts = await podcastsApi.getAllPodcasts();

  const podcasts: Podcast[] = drizzlePodcasts.map(podcast => ({
    id: podcast.id,
    title: podcast.title,
    description: podcast.description,
    cover_image: podcast.cover_image,
    is_paused: podcast.is_paused || false,
    created_at: podcast.created_at ? podcast.created_at.toISOString() : null,
    updated_at: podcast.updated_at ? podcast.updated_at.toISOString() : null,
    status: podcast.status,
    timestamp: podcast.timestamp,
    podcast_group_id: podcast.podcast_group_id,
    language_code: podcast.language_code,
  }));

  if (!podcasts || podcasts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No podcasts found.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first podcast. You can add multiple languages later if needed.
        </p>
        <div className="flex gap-2 justify-center mt-4">
          <Link href="/admin/podcasts/create">
            <Button>Create New Podcast</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-2xl font-bold">All Podcasts</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/admin/podcasts/migrate" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Migrate to Groups
            </Button>
          </Link>
          <Link href="/admin/podcasts/create" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Create New Podcast</Button>
          </Link>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {podcasts.map((podcast) => (
              <TableRow key={podcast.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/podcasts/${podcast.id}`} className="hover:underline">
                      {podcast.title}
                    </Link>
                    {podcast.is_paused && (
                      <Badge variant="secondary" className="text-xs">
                        <Pause className="mr-1 h-3 w-3" />
                        Paused
                      </Badge>
                    )}
                    {podcast.podcast_group_id && (
                      <Badge variant="outline" className="text-xs">
                        <Globe className="mr-1 h-3 w-3" />
                        Multilingual
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {podcast.description || 'No description'}
                </TableCell>
                <TableCell>
                  {podcast.language_code && (
                    <div className="flex items-center gap-1">
                      <span>{getLanguageFlag(podcast.language_code)}</span>
                      <span className="text-sm">{getLanguageName(podcast.language_code)}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {podcast.created_at && format(new Date(podcast.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <PodcastActionsMenu podcast={podcast} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {podcasts.map((podcast) => (
          <Card key={podcast.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/admin/podcasts/${podcast.id}`}
                    className="font-medium hover:underline block line-clamp-2"
                  >
                    {podcast.title}
                  </Link>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {podcast.is_paused && (
                      <Badge variant="secondary" className="text-xs">
                        <Pause className="mr-1 h-3 w-3" />
                        Paused
                      </Badge>
                    )}
                    {podcast.podcast_group_id && (
                      <Badge variant="outline" className="text-xs">
                        <Globe className="mr-1 h-3 w-3" />
                        Multilingual
                      </Badge>
                    )}
                    {podcast.language_code && (
                      <Badge variant="outline" className="text-xs">
                        {getLanguageFlag(podcast.language_code)} {getLanguageName(podcast.language_code)}
                      </Badge>
                    )}
                  </div>

                  {podcast.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {podcast.description}
                    </p>
                  )}

                  {podcast.created_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Created {format(new Date(podcast.created_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>

                <PodcastActionsMenu podcast={podcast} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Podcast Groups View - Shows grouped podcasts with language variants
 */
async function PodcastGroupsView() {
  const podcastGroups = await getAllPodcastGroupsWithLanguages();

  if (!podcastGroups || podcastGroups.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No podcast groups found.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create a new podcast or migrate existing podcasts into groups.
        </p>
        <div className="flex gap-2 justify-center mt-4">
          <Link href="/admin/podcasts/create">
            <Button>Create New Podcast</Button>
          </Link>
          <Link href="/admin/podcasts/migrate">
            <Button variant="outline">Migrate Existing</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-2xl font-bold">Podcast Groups</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/admin/podcasts/migrate" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Migrate Existing
            </Button>
          </Link>
          <Link href="/admin/podcasts/create" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Create New Podcast</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {podcastGroups.map((group) => {
          const languageCount = group.languages.length;

          return (
            <div key={group.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{group.base_title}</h3>
                    <Badge variant="default" className="text-xs">
                      <Globe className="mr-1 h-3 w-3" />
                      {languageCount} {languageCount === 1 ? 'Language' : 'Languages'}
                    </Badge>
                  </div>
                  {group.base_description && (
                    <p className="text-sm text-muted-foreground">{group.base_description}</p>
                  )}
                </div>
                <Link href={`/admin/podcasts/groups/${group.id}/edit`} className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="gap-1 w-full sm:w-auto">
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">Edit Group</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                </Link>
              </div>

              {/* Language Variants */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Language Variants:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {group.languages.map((lang) => (
                    <div
                      key={lang.id}
                      className="flex items-center justify-between p-2 border rounded-md bg-muted/30"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-lg flex-shrink-0">{getLanguageFlag(lang.language_code)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="font-medium text-sm truncate">{lang.title}</span>
                            {lang.is_primary && (
                              <Badge variant="secondary" className="text-xs flex-shrink-0">Primary</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {getLanguageName(lang.language_code)}
                          </span>
                        </div>
                      </div>
                      {lang.podcast_id && (
                        <Link href={`/admin/podcasts/${lang.podcast_id}`} className="flex-shrink-0">
                          <Button variant="ghost" size="sm">Manage</Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
