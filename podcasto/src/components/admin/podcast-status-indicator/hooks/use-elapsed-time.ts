'use client';

import { useState, useEffect } from 'react';
import type { StatusType } from '../types';

/**
 * Custom hook to track elapsed time for pending status
 * Updates every second and returns elapsed time in seconds
 */
export function useElapsedTime(status: StatusType): number {
  const [startTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    // Only show timer for pending status
    if (status.toLowerCase() !== 'pending') {
      return;
    }

    const timer = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsedTime(seconds);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, status]);

  return elapsedTime;
}
