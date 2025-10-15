'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Edit,
  Trash2,
  Play,
  ExternalLink,
  RefreshCw,
  Image as ImageIcon,
  Mail,
} from 'lucide-react';
import { DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useActionMenu } from './hooks/use-action-menu';
import { ActionMenuWrapper } from './shared/action-menu-wrapper';
import { ActionDropdownItem } from './shared/action-dropdown-item';
import { DeleteConfirmationDialog } from './shared/delete-confirmation-dialog';
import { EpisodeItem, ActionMenuItem } from './types';

interface EpisodeActionsMenuProps {
  episode: EpisodeItem;
}

export function EpisodeActionsMenu({ episode }: EpisodeActionsMenuProps) {
  const router = useRouter();
  const [confirmS3Delete, setConfirmS3Delete] = useState(false);

  const {
    menuOpen,
    setMenuOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    isDeleting,
    isUpdating,
    handleDelete,
    handleStatusChange,
    openDeleteDialog,
  } = useActionMenu({
    item: episode,
    itemType: 'episode',
  });

  const canRegenerate =
    episode.status?.toLowerCase() === 'failed' || episode.status?.toLowerCase() === 'published';
  const canSendEmails = episode.status?.toLowerCase() === 'published';

  const handleDeleteWithValidation = async () => {
    if (!confirmS3Delete) {
      return;
    }
    await handleDelete();
    setConfirmS3Delete(false);
  };

  const handleDialogChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setConfirmS3Delete(false);
    }
  };

  const actionItems: ActionMenuItem[] = [
    {
      label: 'Play Episode',
      icon: <Play className="h-4 w-4" />,
      onClick: () =>
        window.open(`/podcasts/${episode.podcast_id}/${episode.id}`, '_blank', 'noopener,noreferrer'),
    },
    {
      label: 'Edit Details',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => router.push(`/admin/episodes/${episode.id}/edit`),
    },
    {
      label: 'View Cover Image',
      icon: <ImageIcon className="h-4 w-4" />,
      onClick: () => window.open(episode.cover_image!, '_blank', 'noopener,noreferrer'),
      show: !!episode.cover_image,
    },
    {
      label: 'Regenerate Audio',
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: () => handleStatusChange?.('regenerate'),
      disabled: isUpdating || !canRegenerate,
      show: canRegenerate,
    },
    {
      label: 'Send Email Notifications',
      icon: <Mail className="h-4 w-4" />,
      onClick: () => handleStatusChange?.('send-emails'),
      disabled: isUpdating || !canSendEmails,
      show: canSendEmails,
    },
  ];

  return (
    <>
      <ActionMenuWrapper open={menuOpen} onOpenChange={setMenuOpen}>
        {actionItems.map((item, index) => (
          <ActionDropdownItem key={index} item={item} />
        ))}

        {episode.audio_url ? (
          <DropdownMenuItem asChild>
            <a href={episode.audio_url} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>Audio File</span>
            </a>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>
            <ExternalLink className="mr-2 h-4 w-4" />
            <span className="text-muted-foreground">Audio File (unavailable)</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <ActionDropdownItem
          item={{
            label: 'Delete Episode',
            icon: <Trash2 className="h-4 w-4" />,
            onClick: openDeleteDialog,
            variant: 'destructive',
            disabled: isUpdating,
          }}
        />
      </ActionMenuWrapper>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={handleDialogChange}
        onConfirm={handleDeleteWithValidation}
        isDeleting={isDeleting}
        title="Delete episode"
        description={`Are you sure you want to delete "${episode.title}"?`}
        confirmText="Delete Permanently"
        additionalWarning={
          <>
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm">
              <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                Warning: This will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1 text-yellow-800 dark:text-yellow-200">
                <li>Episode record from database</li>
                <li>Audio files from AWS S3</li>
                <li>Cover images from AWS S3</li>
                <li>Transcripts and metadata from AWS S3</li>
              </ul>
              <p className="mt-2 font-semibold text-red-600 dark:text-red-400">
                This action cannot be undone!
              </p>
            </div>
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="confirm-s3-delete"
                checked={confirmS3Delete}
                onCheckedChange={(checked) => setConfirmS3Delete(checked === true)}
                disabled={isDeleting}
              />
              <label
                htmlFor="confirm-s3-delete"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I understand that all files will be permanently deleted from AWS S3
              </label>
            </div>
          </>
        }
      />
    </>
  );
}
