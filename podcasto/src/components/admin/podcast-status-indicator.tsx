'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Clock, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

// Status types - add custom as fallback
type StatusType = 'pending' | 'completed' | 'error' | 'unknown' | string;

interface PodcastStatusIndicatorProps {
  podcastId: string;
  episodeId?: string;
  timestamp?: string;
  initialStatus?: StatusType;
  onStatusChange?: (status: StatusType) => void;
}

/**
 * Component that displays the podcast generation status
 * and automatically refreshes to check for updates
 */
export function PodcastStatusIndicator({
  podcastId,
  episodeId,
  timestamp,
  initialStatus = 'pending',
  onStatusChange
}: PodcastStatusIndicatorProps) {
  const [status, setStatus] = useState<StatusType>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [startTime] = useState<Date>(new Date()); // Track when indicator was first shown
  const [elapsedTime, setElapsedTime] = useState<number>(0); // Seconds elapsed
  
  // Use a ref instead of state to avoid dependency cycles
  const intervalsRef = useRef<{
    quick: NodeJS.Timeout | null;
    slow: NodeJS.Timeout | null;
    switchTimeout: NodeJS.Timeout | null;
  }>({ quick: null, slow: null, switchTimeout: null });

  // Helper function to clear all intervals
  const clearAllIntervals = useCallback(() => {
    const intervals = intervalsRef.current;
    if (intervals.quick) clearInterval(intervals.quick);
    if (intervals.slow) clearInterval(intervals.slow);
    if (intervals.switchTimeout) clearTimeout(intervals.switchTimeout);
    
    intervalsRef.current = { quick: null, slow: null, switchTimeout: null };
  }, []);

  // Function to check podcast status from API
  const checkStatus = useCallback(async () => {
    // Need at least one identifier
    if (!podcastId || (!episodeId && !timestamp)) return;
    
    // Don't check if status is already final (completed or error)
    // Using case-insensitive comparison
    const finalStatuses = ['completed', 'complete', 'error'];
    if (status && finalStatuses.includes(status.toLowerCase())) {
      clearAllIntervals();
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Construct API URL based on available params
      let statusUrl = `/api/podcasts/${podcastId}/status?`;
      
      if (episodeId) {
        statusUrl += `episodeId=${episodeId}`;
      } else if (timestamp) {
        statusUrl += `timestamp=${timestamp}`;
      }
      
      const response = await fetch(statusUrl);
      
      if (!response.ok) {
        throw new Error('Failed to check podcast status');
      }
      
      const data = await response.json();
      const newStatus = data.status as StatusType;
      
      // Update status if changed
      if (newStatus !== status) {
        setStatus(newStatus);
        
        // Call the callback if provided
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
        
        // If we received a final status, clear all intervals
        if (finalStatuses.includes(newStatus.toLowerCase())) {
          clearAllIntervals();
        }
        
        // Show toast for completed or failed status
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
  
  // Set up polling to check status
  useEffect(() => {
    // Variable to check if the component is still mounted
    let isMounted = true;
    
    // Helper function that wraps checkStatus to respect mounting state
    const safeCheckStatus = async () => {
      if (isMounted) {
        await checkStatus();
      }
    };
    
    // Don't poll if we don't have the necessary data
    // or if status is already final
    const finalStatuses = ['completed', 'complete', 'error'];
    if (!podcastId || (!episodeId && !timestamp) || finalStatuses.includes(status.toLowerCase())) {
      clearAllIntervals();
      return () => {
        isMounted = false;
      };
    }
    
    // Check status immediately
    safeCheckStatus();
    
    // Clear any existing intervals first
    clearAllIntervals();
    
    // Set up more frequent polling initially, then slow down
    // Check every 5 seconds for the first minute, then every 30 seconds
    const quickInterval = setInterval(safeCheckStatus, 5000);
    
    // After 60 seconds, switch to slower polling
    const switchToSlowPollingTimeout = setTimeout(() => {
      if (intervalsRef.current.quick) {
        clearInterval(intervalsRef.current.quick);
        intervalsRef.current.quick = null;
      }
      
      // Only set up slow polling if status is still not final and component is mounted
      if (isMounted && !finalStatuses.includes(status.toLowerCase())) {
        const slowInterval = setInterval(safeCheckStatus, 30000);
        intervalsRef.current.slow = slowInterval;
      }
    }, 60000);
    
    // Store interval IDs for cleanup
    intervalsRef.current = {
      quick: quickInterval,
      slow: null,
      switchTimeout: switchToSlowPollingTimeout
    };
    
    // Cleanup intervals and timeout on unmount or when dependencies change
    return () => {
      isMounted = false;
      clearAllIntervals();
    };
  }, [podcastId, episodeId, timestamp, status, checkStatus, clearAllIntervals]);
  
  // Update elapsed time every second
  useEffect(() => {
    // Only show timer for pending status (ignore case)
    if (status.toLowerCase() !== 'pending') {
      return;
    }
    
    const timer = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsedTime(seconds);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startTime, status]);
  
  // Format elapsed time
  const formatElapsedTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  };
  
  // Get status display details
  const getStatusDetails = () => {
    // Convert to lowercase for case-insensitive comparison
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
        // Show custom status exactly as it appears in the database
        return {
          label: status,
          color: 'bg-blue-500',
          icon: Clock,
          message: `Podcast status: ${status}`
        };
    }
  };
  
  const statusDetails = getStatusDetails();
  const Icon = statusDetails.icon;
  
  // If no podcast ID or any identifier, don't render anything
  if (!podcastId || (!episodeId && !timestamp)) {
    return null;
  }
  
  // Format the last checked time
  const lastCheckedText = lastChecked 
    ? `Last checked: ${lastChecked.toLocaleTimeString()}`
    : '';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${statusDetails.color} text-white px-2 py-1`}
            >
              <Icon className="h-3 w-3 mr-1" />
              <span>{statusDetails.label}</span>
              {isLoading && status.toLowerCase() === 'pending' && (
                <Loader2 className="h-3 w-3 ml-1 animate-spin" />
              )}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{statusDetails.message}</p>
          {status.toLowerCase() === 'pending' && (
            <>
              <p className="text-xs mt-1">Processing time: {formatElapsedTime(elapsedTime)}</p>
              <p className="text-xs mt-1 italic">Average completion time: 2-5 minutes</p>
            </>
          )}
          {status.toLowerCase() !== 'pending' && lastCheckedText && (
            <p className="text-xs mt-1">{lastCheckedText}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 