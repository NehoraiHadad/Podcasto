'use client';

import { useState, useEffect } from 'react';
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

// Status types
type StatusType = 'pending' | 'completed' | 'error' | 'unknown';

interface PodcastStatusIndicatorProps {
  podcastId: string;
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
  timestamp,
  initialStatus = 'pending',
  onStatusChange
}: PodcastStatusIndicatorProps) {
  const [status, setStatus] = useState<StatusType>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  // Function to check podcast status from API
  const checkStatus = async () => {
    if (!podcastId || !timestamp) return;
    
    try {
      setIsLoading(true);
      
      // This would be a real API call to check status
      // For now, we'll simulate a status check
      const response = await fetch(`/api/podcasts/${podcastId}/status?timestamp=${timestamp}`);
      
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
        
        // Show toast for completed or failed status
        if (newStatus === 'completed') {
          toast.success('Podcast generation complete', {
            description: 'Your podcast episode has been generated successfully.'
          });
        } else if (newStatus === 'error') {
          toast.error(data.message || 'There was an error generating your podcast.');
        }
      }
      
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking podcast status:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set up polling to check status
  useEffect(() => {
    // Don't poll if we don't have the necessary data
    // or if status is already final
    if (!podcastId || !timestamp || status === 'completed' || status === 'error') {
      return;
    }
    
    // Check status immediately
    checkStatus();
    
    // Set up polling every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [podcastId, timestamp, status]);
  
  // Get status display details
  const getStatusDetails = () => {
    switch (status) {
      case 'pending':
        return {
          label: 'Processing',
          color: 'bg-yellow-500',
          icon: Clock,
          message: 'Podcast generation is in progress.'
        };
      case 'completed':
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
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-500',
          icon: AlertCircle,
          message: 'Status unknown.'
        };
    }
  };
  
  const statusDetails = getStatusDetails();
  const Icon = statusDetails.icon;
  
  // If no podcast ID or timestamp, don't render anything
  if (!podcastId || !timestamp) {
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
              {isLoading && (
                <Loader2 className="h-3 w-3 ml-1 animate-spin" />
              )}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{statusDetails.message}</p>
          {lastCheckedText && <p className="text-xs mt-1">{lastCheckedText}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 