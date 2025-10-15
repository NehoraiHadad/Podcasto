'use client';

import Link from 'next/link';
import { Play, Plus, Pause, PlayCircle, Trash2, Eye, AlertCircle } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useActionMenu } from './hooks/use-action-menu';
import { ActionMenuWrapper } from './shared/action-menu-wrapper';
import { ActionDropdownItem } from './shared/action-dropdown-item';
import { DeleteConfirmationDialog } from './shared/delete-confirmation-dialog';
import { PodcastStatusIndicator } from '../podcast-status-indicator';
import { GenerateEpisodeButton } from '../generate-episode-button';
import { PodcastItem, ActionMenuItem } from './types';

interface PodcastActionsMenuProps {
  podcast: PodcastItem;
  onStatusChange?: () => void;
}

export function PodcastActionsMenu({ podcast, onStatusChange }: PodcastActionsMenuProps) {
  const router = useRouter();
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generatedEpisodeId, _setGeneratedEpisodeId] = useState<string | undefined>(undefined);
  const [generatedTimestamp, _setGeneratedTimestamp] = useState<string | undefined>(undefined);
  const [generatedStatus, setGeneratedStatus] = useState<string | undefined>(undefined);
  const [showStatusIndicator, setShowStatusIndicator] = useState(false);

  const {
    menuOpen,
    setMenuOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    isDeleting,
    isUpdating,
    handleDelete,
    handleToggleStatus,
    openDeleteDialog,
  } = useActionMenu({
    item: podcast,
    itemType: 'podcast',
    onUpdate: onStatusChange,
  });

  const handleOpenGenerateDialog = () => {
    setMenuOpen(false);
    setShowGenerateDialog(true);
  };

  const handleStatusChangeCallback = useCallback(
    (newStatus: string) => {
      if (showStatusIndicator && generatedEpisodeId && newStatus) {
        setGeneratedStatus(newStatus);
        const finalStatuses = ['completed', 'complete', 'error'];
        if (finalStatuses.includes(newStatus.toLowerCase())) {
          setShowStatusIndicator(false);
        }
      }
      onStatusChange?.();
    },
    [showStatusIndicator, generatedEpisodeId, onStatusChange]
  );

  const isActiveGeneration = showStatusIndicator && generatedEpisodeId;
  const statusToShow = isActiveGeneration ? generatedStatus : podcast.status;
  const timestampToShow = isActiveGeneration ? generatedTimestamp : podcast.timestamp;
  const episodeIdToShow = isActiveGeneration ? generatedEpisodeId : undefined;

  const pendingStatuses = ['pending'];
  const shouldShowStatus = Boolean(
    (showStatusIndicator && generatedEpisodeId) ||
      (podcast.status &&
        pendingStatuses.includes(podcast.status.toLowerCase()) &&
        podcast.timestamp &&
        !showStatusIndicator)
  );

  const isPending = podcast.status === 'pending';

  const actionItems: ActionMenuItem[] = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => router.push(`/admin/podcasts/${podcast.id}`),
    },
    {
      label: 'Generate Episode Now',
      icon: <Plus className="h-4 w-4" />,
      onClick: handleOpenGenerateDialog,
      disabled: generatedStatus?.toLowerCase() === 'pending',
    },
    {
      label: podcast.is_paused ? 'Resume Generation' : 'Pause Generation',
      icon: podcast.is_paused ? <PlayCircle className="h-4 w-4" /> : <Pause className="h-4 w-4" />,
      onClick: () => handleToggleStatus?.(),
      disabled: isUpdating,
    },
  ];

  return (
    <>
      <div className="flex items-center gap-2">
        {shouldShowStatus && (
          <PodcastStatusIndicator
            podcastId={podcast.id}
            episodeId={episodeIdToShow}
            timestamp={timestampToShow}
            initialStatus={statusToShow || 'pending'}
            onStatusChange={handleStatusChangeCallback}
          />
        )}

        <ActionMenuWrapper open={menuOpen} onOpenChange={setMenuOpen}>
          {actionItems.map((item, index) => (
            <ActionDropdownItem key={index} item={item} />
          ))}

          <DropdownMenuItem asChild>
            <Link href={`/podcasts/${podcast.id}`}>
              <Play className="mr-2 h-4 w-4" />
              View Public Page
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={`/admin/podcasts/${podcast.id}/episodes`}>
              <Play className="mr-2 h-4 w-4" />
              View Episodes
            </Link>
          </DropdownMenuItem>

          {isPending && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-amber-500">
                <AlertCircle className="mr-2 h-4 w-4" />
                Processing...
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <ActionDropdownItem
            item={{
              label: 'Delete',
              icon: <Trash2 className="h-4 w-4" />,
              onClick: openDeleteDialog,
              variant: 'destructive',
            }}
          />
        </ActionMenuWrapper>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title="Are you sure?"
        description={`This action will permanently delete the podcast "${podcast.title}" and all its episodes. This action cannot be undone.`}
        confirmText="Delete"
      />

      <GenerateEpisodeButton
        podcastId={podcast.id}
        isPaused={podcast.is_paused}
        triggerOpen={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        hideButton={true}
      />
    </>
  );
}
