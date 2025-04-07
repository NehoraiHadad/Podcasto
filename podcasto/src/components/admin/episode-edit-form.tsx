'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { updateEpisodeDetails } from '@/lib/actions/episode-actions';
import { EpisodeImageManager } from './episode-image-manager';

// Define the form validation schema
const formSchema = z.object({
  title: z
    .string()
    .min(3, {
      message: 'Title must be at least 3 characters.',
    })
    .max(255, {
      message: 'Title must not exceed 255 characters.',
    }),
  description: z.string().optional(),
  language: z.string().optional(),
  status: z.enum(['published', 'pending', 'processing', 'failed']),
});

// Define the expected episode type for the component
interface Episode {
  id: string;
  podcast_id: string | null;
  title: string;
  description: string | null;
  language: string | null;
  audio_url: string;
  duration: number | null;
  created_at: Date | null;
  published_at: Date | null;
  status: string | null;
  metadata: string | null;
  cover_image: string | null;
}

interface EpisodeEditFormProps {
  episode: Episode;
}

export function EpisodeEditForm({ episode }: EpisodeEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with episode data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: episode.title,
      description: episode.description || '',
      language: episode.language || '',
      status: (episode.status?.toLowerCase() || 'pending') as 'published' | 'pending' | 'processing' | 'failed',
    },
  });
  
  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      
      // Update episode details
      await updateEpisodeDetails(episode.id, {
        title: values.title,
        description: values.description || undefined,
        language: values.language || undefined,
        status: values.status,
      });
      
      toast.success('Episode updated successfully');
      router.push('/admin/episodes');
      router.refresh();
    } catch (error) {
      console.error('Error updating episode:', error);
      toast.error('Failed to update episode');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      The title of the episode.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={5}
                        placeholder="Episode description"
                      />
                    </FormControl>
                    <FormDescription>
                      A brief summary of the episode.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="en-US, he-IL, etc."
                      />
                    </FormControl>
                    <FormDescription>
                      The language of this episode (inherited from podcast settings but can be overridden here).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The current status of the episode.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-center gap-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
                <Link href="/admin/episodes">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </div>
        
        <div className="md:w-1/3">
          <EpisodeImageManager 
            episodeId={episode.id}
            podcastId={episode.podcast_id}
            coverImage={episode.cover_image}
            episodeTitle={episode.title}
          />
          
          <Card className="mt-4">
            <CardContent className="p-4 space-y-4">
              <h3 className="text-lg font-medium">Episode Info</h3>
              
              {episode.audio_url && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Audio URL</p>
                  <p className="text-sm break-all">
                    <a
                      href={episode.audio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {episode.audio_url}
                    </a>
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm">
                  {episode.duration
                    ? `${Math.floor(episode.duration / 60)}:${(episode.duration % 60)
                        .toString()
                        .padStart(2, '0')}`
                    : 'Unknown'}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm">
                  {episode.created_at
                    ? new Date(episode.created_at).toLocaleDateString()
                    : 'Unknown'}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Published</p>
                <p className="text-sm">
                  {episode.published_at
                    ? new Date(episode.published_at).toLocaleDateString()
                    : 'Not published'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 