'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { UseStatusPollingOptions, StatusType } from '../types';

const FINAL_STATUSES = ['completed', 'complete', 'error'];
const QUICK_POLL_INTERVAL = 5000;
const SLOW_POLL_INTERVAL = 30000;
const SWITCH_TO_SLOW_DELAY = 60000;

export function useStatusPolling({
  podcastId,
  episodeId,
  timestamp,
  initialStatus,
  onStatusChange
}: UseStatusPollingOptions) {
  const [status, setStatus] = useState<StatusType>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const intervalsRef = useRef<{
    quick: NodeJS.Timeout | null;
    slow: NodeJS.Timeout | null;
    switchTimeout: NodeJS.Timeout | null;
  }>({ quick: null, slow: null, switchTimeout: null });

  const clearAllIntervals = useCallback(() => {
    const intervals = intervalsRef.current;
    if (intervals.quick) clearInterval(intervals.quick);
    if (intervals.slow) clearInterval(intervals.slow);
    if (intervals.switchTimeout) clearTimeout(intervals.switchTimeout);
    intervalsRef.current = { quick: null, slow: null, switchTimeout: null };
  }, []);

  const checkStatus = useCallback(async () => {
    if (!podcastId || (!episodeId && !timestamp)) return;
    if (status && FINAL_STATUSES.includes(status.toLowerCase())) {
      clearAllIntervals();
      return;
    }
    try {
      setIsLoading(true);
      const param = episodeId ? `episodeId=${episodeId}` : `timestamp=${timestamp}`;
      const statusUrl = `/api/podcasts/${podcastId}/status?${param}`;
      const response = await fetch(statusUrl);
      if (!response.ok) throw new Error('Failed to check podcast status');
      const result = await response.json();

      // Extract data from standardized API response format
      const data = result.data;
      const newStatus = data.status as StatusType;

      if (newStatus !== status) {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
        if (FINAL_STATUSES.includes(newStatus.toLowerCase())) clearAllIntervals();
        if (newStatus.toLowerCase() === 'completed') {
          toast.success('Podcast generation complete', {
            description: 'Your podcast episode has been generated successfully.'
          });
        } else if (newStatus.toLowerCase() === 'error') {
          toast.error(data.message || 'There was an error generating your podcast.');
        }
      }
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking podcast status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [podcastId, episodeId, timestamp, status, onStatusChange, clearAllIntervals]);

  useEffect(() => {
    let isMounted = true;
    const safeCheckStatus = async () => {
      if (isMounted) await checkStatus();
    };
    if (!podcastId || (!episodeId && !timestamp) || FINAL_STATUSES.includes(status.toLowerCase())) {
      clearAllIntervals();
      return () => { isMounted = false; };
    }
    safeCheckStatus();
    clearAllIntervals();
    const quickInterval = setInterval(safeCheckStatus, QUICK_POLL_INTERVAL);
    const switchToSlowPollingTimeout = setTimeout(() => {
      if (intervalsRef.current.quick) {
        clearInterval(intervalsRef.current.quick);
        intervalsRef.current.quick = null;
      }
      if (isMounted && !FINAL_STATUSES.includes(status.toLowerCase())) {
        const slowInterval = setInterval(safeCheckStatus, SLOW_POLL_INTERVAL);
        intervalsRef.current.slow = slowInterval;
      }
    }, SWITCH_TO_SLOW_DELAY);
    intervalsRef.current = { quick: quickInterval, slow: null, switchTimeout: switchToSlowPollingTimeout };
    return () => {
      isMounted = false;
      clearAllIntervals();
    };
  }, [podcastId, episodeId, timestamp, status, checkStatus, clearAllIntervals]);

  return { status, isLoading, lastChecked };
}
