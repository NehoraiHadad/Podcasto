'use client';

import { useMemo } from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { StatusType, StatusDetails } from '../types';

/**
 * Custom hook to get status details based on current status
 * Returns memoized status details object with label, color, icon, and message
 */
export function useStatusDetails(status: StatusType): StatusDetails {
  return useMemo(() => {
    const statusLower = status.toLowerCase();

    switch (statusLower) {
      case 'pending':
        return {
          label: 'Processing',
          color: 'bg-yellow-500',
          icon: Clock,
          message: 'Podcast generation is in progress.'
        };
      case 'completed':
      case 'complete':
        return {
          label: 'Complete',
          color: 'bg-green-500',
          icon: CheckCircle,
          message: 'Podcast has been generated successfully.'
        };
      case 'error':
        return {
          label: 'Failed',
          color: 'bg-red-500',
          icon: AlertCircle,
          message: 'There was an error generating the podcast.'
        };
      case 'unknown':
        return {
          label: 'Unknown',
          color: 'bg-gray-500',
          icon: AlertCircle,
          message: 'Status unknown.'
        };
      default:
        return {
          label: status,
          color: 'bg-blue-500',
          icon: Clock,
          message: `Podcast status: ${status}`
        };
    }
  }, [status]);
}
