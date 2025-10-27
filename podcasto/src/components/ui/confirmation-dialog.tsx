'use client';

import { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  title: string;
  description: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default';
  additionalWarning?: ReactNode;
  loadingText?: string;
}

/**
 * Generic confirmation dialog component
 * Replaces duplicate delete/confirmation dialogs across the app
 *
 * @example
 * <ConfirmationDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onConfirm={handleDelete}
 *   isLoading={isDeleting}
 *   title="Delete Item"
 *   description="Are you sure? This cannot be undone."
 *   confirmText="Delete"
 *   variant="destructive"
 * />
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
  additionalWarning,
  loadingText,
}: ConfirmationDialogProps) {
  const buttonClassName = variant === 'destructive'
    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    : '';

  const displayText = isLoading
    ? (loadingText || `${confirmText}ing...`)
    : confirmText;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            {typeof description === 'string' ? <p>{description}</p> : description}
            {additionalWarning}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className={buttonClassName}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {displayText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
