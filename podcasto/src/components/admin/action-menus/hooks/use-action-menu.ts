'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deletePodcast } from '@/lib/actions/podcast/delete';
import { togglePodcastPause } from '@/lib/actions/podcast/toggle-pause';
import { deleteEpisode, regenerateEpisodeAudio } from '@/lib/actions/episode-actions';
import { resendEpisodeEmails } from '@/lib/actions/episode/email-actions';
import { UseActionMenuOptions, UseActionMenuReturn, PodcastItem, EpisodeItem } from '../types';

export function useActionMenu<T extends PodcastItem | EpisodeItem>({
  item,
  itemType,
  onUpdate,
}: UseActionMenuOptions<T>): UseActionMenuReturn {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const openDeleteDialog = () => {
    setMenuOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      let success = false;
      let error: string | undefined;

      if (itemType === 'podcast') {
        const result = await deletePodcast(item.id);
        success = result.success;
        error = result.error;
      } else {
        // deleteEpisode returns boolean, convert to result format
        success = await deleteEpisode(item.id);
        if (!success) {
          error = 'Failed to delete episode';
        }
      }

      if (success) {
        const itemName = itemType === 'podcast' ? 'Podcast' : 'Episode';
        toast.success(`${itemName} deleted successfully`);
        setDeleteDialogOpen(false);
        onUpdate?.();
        router.refresh();
      } else {
        toast.error(error || 'Failed to delete');
      }
    } catch (error) {
      console.error(`Error deleting ${itemType}:`, error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (itemType !== 'podcast') return;

    try {
      setIsUpdating(true);
      const result = await togglePodcastPause(item.id);

      if (result.success) {
        const action = result.isPaused ? 'paused' : 'resumed';
        toast.success(`Podcast ${action} successfully`);
        closeMenu();
        onUpdate?.();
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update podcast');
      }
    } catch (error) {
      console.error('Error toggling podcast pause:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (itemType !== 'episode') return;

    try {
      setIsUpdating(true);

      if (newStatus === 'regenerate') {
        await regenerateEpisodeAudio(item.id);
        toast.success('Audio regeneration started');
      } else if (newStatus === 'send-emails') {
        const result = await resendEpisodeEmails(item.id);
        if (result.success) {
          toast.success(
            `Email notifications sent successfully!\nSent: ${result.emailsSent}/${result.totalSubscribers} subscribers`
          );
        } else {
          toast.error(`Failed to send emails: ${result.error}`);
        }
      }

      closeMenu();
      onUpdate?.();
      router.refresh();
    } catch (error) {
      console.error('Error updating episode status:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    menuOpen,
    setMenuOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    isDeleting,
    isUpdating,
    handleDelete,
    handleToggleStatus: itemType === 'podcast' ? handleToggleStatus : undefined,
    handleStatusChange: itemType === 'episode' ? handleStatusChange : undefined,
    closeMenu,
    openDeleteDialog,
  };
}
