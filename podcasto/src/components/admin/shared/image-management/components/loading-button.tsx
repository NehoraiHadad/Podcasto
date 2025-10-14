'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps {
  /** Whether the button is in loading state */
  isLoading: boolean;

  /** Text to display when loading */
  loadingText: string;

  /** Custom icon to display when loading (defaults to spinning Loader2) */
  loadingIcon?: React.ReactNode;

  /** Text to display when idle */
  idleText: string | React.ReactNode;

  /** Icon to display when idle */
  idleIcon?: React.ReactNode;

  /** Click handler */
  onClick: () => void;

  /** Additional disabled state (in addition to loading) */
  disabled?: boolean;

  /** Custom className */
  className?: string;

  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';

  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';

  /** Button type */
  type?: 'button' | 'submit' | 'reset';
}

/**
 * A button component that displays loading state with spinner.
 * Automatically disables interaction while loading.
 *
 * @example
 * <LoadingButton
 *   isLoading={isUploading}
 *   loadingText="Uploading..."
 *   idleText="Upload Image"
 *   onClick={handleUpload}
 *   disabled={!selectedFile}
 * />
 */
export function LoadingButton({
  isLoading,
  loadingText,
  loadingIcon,
  idleText,
  idleIcon,
  onClick,
  disabled = false,
  className = 'w-full',
  variant = 'default',
  size = 'default',
  type = 'button'
}: LoadingButtonProps) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={className}
      variant={variant}
      size={size}
    >
      {isLoading ? (
        <>
          {loadingIcon || <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loadingText}
        </>
      ) : (
        <>
          {idleIcon}
          {idleText}
        </>
      )}
    </Button>
  );
}
