'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Save, Trash2, Play, Pause } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  updateUserPodcastAction,
  deleteUserPodcastAction,
  pauseUserPodcastAction,
  resumeUserPodcastAction
} from '@/lib/actions/user-podcast-actions';
import type { Podcast } from '@/lib/db/api/podcasts/types';
import type { PodcastConfig } from '@/lib/db/api/podcast-configs';

const settingsSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  episodeFrequency: z.number().int().min(1).max(30),
  autoGenerationEnabled: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface PodcastSettingsFormProps {
  podcast: Podcast;
  config: PodcastConfig | null;
}

export function PodcastSettingsForm({ podcast, config }: PodcastSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingPause, setIsTogglingPause] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      title: podcast.title,
      description: podcast.description || '',
      coverImage: podcast.cover_image || '',
      episodeFrequency: config?.episode_frequency || 7,
      autoGenerationEnabled: podcast.auto_generation_enabled || false,
    },
  });

  const onSubmit = async (values: SettingsFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await updateUserPodcastAction(podcast.id, {
        title: values.title,
        description: values.description,
        coverImage: values.coverImage,
        episodeFrequency: values.episodeFrequency,
        autoGenerationEnabled: values.autoGenerationEnabled,
      });

      if (result.success) {
        toast({
          title: 'Settings updated',
          description: 'Your podcast settings have been saved.',
        });

        // Refresh the page to show updated data
        router.refresh();
      } else {
        toast({
          title: 'Update failed',
          description: result.error || 'Failed to update settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteUserPodcastAction(podcast.id);

      if (result.success) {
        toast({
          title: 'Podcast deleted',
          description: 'Your podcast has been permanently deleted.',
        });

        // Redirect to my podcasts
        router.push('/podcasts/my');
      } else {
        toast({
          title: 'Delete failed',
          description: result.error || 'Failed to delete podcast',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting podcast:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePause = async () => {
    setIsTogglingPause(true);

    try {
      const result = podcast.is_paused
        ? await resumeUserPodcastAction(podcast.id)
        : await pauseUserPodcastAction(podcast.id);

      if (result.success) {
        toast({
          title: podcast.is_paused ? 'Podcast resumed' : 'Podcast paused',
          description: podcast.is_paused
            ? 'Your podcast is now active.'
            : 'Your podcast has been paused.',
        });

        // Refresh the page
        router.refresh();
      } else {
        toast({
          title: 'Action failed',
          description: result.error || 'Failed to update podcast status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling pause:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingPause(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>Podcast Settings</CardTitle>
          <CardDescription>
            Update your podcast details and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cover Image */}
              <FormField
                control={form.control}
                name="coverImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://example.com/podcast-cover.jpg" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional: Provide a URL to your podcast cover image. Leave empty to use the default image.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Episode Frequency */}
              <FormField
                control={form.control}
                name="episodeFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Episode Frequency</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Daily</SelectItem>
                        <SelectItem value="7">Weekly</SelectItem>
                        <SelectItem value="14">Bi-weekly</SelectItem>
                        <SelectItem value="30">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often new episodes should be generated
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Auto-generation */}
              <FormField
                control={form.control}
                name="autoGenerationEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Auto-generation</FormLabel>
                      <FormDescription>
                        Automatically generate episodes based on the frequency
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Next Scheduled Generation */}
              {podcast.next_scheduled_generation && podcast.auto_generation_enabled && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Next scheduled generation</p>
                  <p className="text-lg font-medium">
                    {new Date(podcast.next_scheduled_generation).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Submit */}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Pause/Resume */}
      <Card>
        <CardHeader>
          <CardTitle>Podcast Status</CardTitle>
          <CardDescription>
            {podcast.is_paused
              ? 'This podcast is currently paused. Resume to enable episode generation.'
              : 'This podcast is active. Pause to temporarily stop episode generation.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant={podcast.is_paused ? 'default' : 'outline'}
            onClick={handleTogglePause}
            disabled={isTogglingPause}
          >
            {isTogglingPause ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {podcast.is_paused ? 'Resuming...' : 'Pausing...'}
              </>
            ) : podcast.is_paused ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume Podcast
              </>
            ) : (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause Podcast
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Podcast */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete this podcast and all associated episodes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Podcast
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  podcast &quot;{podcast.title}&quot; and all associated episodes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete Permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
