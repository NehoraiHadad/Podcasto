import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import type { S3FileInfo } from '@/lib/services/s3-service-types';

interface DeleteFileDialogProps {
  open: boolean;
  file: S3FileInfo | null;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteFileDialog({
  open,
  file,
  deleting,
  onConfirm,
  onCancel
}: DeleteFileDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onCancel()}
      onConfirm={onConfirm}
      isLoading={deleting}
      title="Delete File"
      description={
        <>
          Are you sure you want to delete <strong>{file?.name}</strong>?
          This action cannot be undone.
        </>
      }
      confirmText="Delete"
      variant="destructive"
      loadingText="Deleting..."
    />
  );
}
