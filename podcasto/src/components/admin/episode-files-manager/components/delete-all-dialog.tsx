import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface DeleteAllDialogProps {
  open: boolean;
  filesCount: number;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteAllDialog({
  open,
  filesCount,
  deleting,
  onConfirm,
  onCancel
}: DeleteAllDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onCancel()}
      onConfirm={onConfirm}
      isLoading={deleting}
      title="Delete All Files"
      description={`Are you sure you want to delete all ${filesCount} file(s)? This will remove all content, audio, transcripts, and images for this episode. This action cannot be undone.`}
      confirmText="Delete All"
      variant="destructive"
      loadingText="Deleting..."
    />
  );
}
