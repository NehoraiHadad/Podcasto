'use client';

import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { DeleteConfirmationProps } from '../types';

/**
 * @deprecated Use ConfirmationDialog from @/components/ui/confirmation-dialog instead
 * This wrapper exists for backward compatibility
 */
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  title,
  description,
  confirmText = 'Delete',
  additionalWarning,
}: DeleteConfirmationProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      isLoading={isDeleting}
      title={title}
      description={description}
      confirmText={confirmText}
      additionalWarning={additionalWarning}
      variant="destructive"
      loadingText="Deleting..."
    />
  );
}
