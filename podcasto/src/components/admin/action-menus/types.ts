import { ReactNode } from 'react';

export interface ActionMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  show?: boolean;
}

export interface DeleteConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
  title: string;
  description: string;
  confirmText?: string;
  additionalWarning?: ReactNode;
}

export interface UseActionMenuOptions<T> {
  item: T;
  itemType: 'podcast' | 'episode';
  onUpdate?: () => void;
}

export interface UseActionMenuReturn {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  isDeleting: boolean;
  isUpdating: boolean;
  handleDelete: () => Promise<void>;
  handleToggleStatus?: () => Promise<void>;
  handleStatusChange?: (newStatus: string) => Promise<void>;
  closeMenu: () => void;
  openDeleteDialog: () => void;
}

export interface PodcastItem {
  id: string;
  title: string;
  is_paused?: boolean;
  status?: string;
  timestamp?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface EpisodeItem {
  id: string;
  podcast_id: string;
  title: string;
  audio_url: string | null;
  cover_image?: string | null;
  status?: string | null;
  [key: string]: string | number | boolean | null | undefined;
}
