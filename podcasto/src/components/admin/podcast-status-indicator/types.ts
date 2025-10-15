import type { LucideIcon } from 'lucide-react';

export type StatusType = 'pending' | 'completed' | 'error' | 'unknown' | string;

export interface PodcastStatusIndicatorProps {
  podcastId: string;
  episodeId?: string;
  timestamp?: string;
  initialStatus?: StatusType;
  onStatusChange?: (status: StatusType) => void;
}

export interface UseStatusPollingOptions {
  podcastId: string;
  episodeId?: string;
  timestamp?: string;
  initialStatus: StatusType;
  onStatusChange?: (status: StatusType) => void;
}

export interface StatusDetails {
  label: string;
  color: string;
  icon: LucideIcon;
  message: string;
}
