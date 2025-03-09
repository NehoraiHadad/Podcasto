'use client';

import { useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { getAuthState } from '@/lib/actions/auth-events';

type AuthEventState = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Hook for subscribing to auth state changes using Server-Sent Events (SSE)
 * This replaces the need for client-side Supabase auth subscriptions
 * Optimized for better responsiveness and immediate UI updates
 * 
 * @param initialUser Optional user data fetched from the server
 * @returns The current auth state
 */
export function useAuthEvents({ initialUser = null }: { initialUser?: User | null } = {}) {
  const [authState, setAuthState] = useState<AuthEventState>({
    user: initialUser,
    isLoading: !initialUser,
    error: null,
  });
  
  // Keep track of the last timestamp to detect changes
  const lastTimestampRef = useRef<number>(Date.now());
  
  // Keep track of connection status
  const [isConnected, setIsConnected] = useState(false);
  
  // Reference to the event source
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Skip initial user fetch if we already have data from the server
    if (initialUser) {
      setAuthState({
        user: initialUser,
        isLoading: false,
        error: null,
      });
    } else {
      // Get initial auth state from server
      const fetchInitialState = async () => {
        try {
          const { user, error } = await getAuthState();
          
          setAuthState({
            user,
            isLoading: false,
            error: error ? new Error(error.message) : null,
          });
        } catch (error) {
          setAuthState({
            user: null,
            isLoading: false,
            error: error instanceof Error ? error : new Error('Failed to fetch auth state'),
          });
        }
      };

      fetchInitialState();
    }
  }, [initialUser]);

  useEffect(() => {
    // Function to create and set up the SSE connection
    const setupEventSource = () => {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      // Connect to SSE endpoint for real-time auth state updates
      const eventSource = new EventSource('/api/auth/events');
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        setIsConnected(true);
        console.log('SSE connection established');
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const timestamp = data.timestamp || Date.now();
          
          // Only process if this is a newer message
          if (timestamp > lastTimestampRef.current) {
            lastTimestampRef.current = timestamp;
            
            if (data.error) {
              // Handle auth errors gracefully - don't treat missing session as an error to display
              const errorMessage = data.error.message || 'Authentication error';
              const isSessionMissing = errorMessage.includes('session missing') || 
                                      errorMessage.includes('No active session');
              
              setAuthState(prev => ({
                ...prev,
                user: null,
                isLoading: false,
                // Only set error state for non-session-missing errors
                error: isSessionMissing ? null : new Error(errorMessage),
              }));
              return;
            }
            
            // Check if user state has actually changed
            const hasUserChanged = 
              (!authState.user && data.user) || 
              (authState.user && !data.user) ||
              (authState.user && data.user && authState.user.id !== data.user.id);
              
            setAuthState(prev => ({
              ...prev,
              user: data.user,
              error: null,
              isLoading: false,
            }));
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            setupEventSource();
          }
        }, 5000);
      };
    };
    
    // Set up the initial connection
    setupEventSource();
    
    // Clean up on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // If not connected to SSE for more than 10 seconds, fetch state directly
  useEffect(() => {
    if (!isConnected) {
      const timer = setTimeout(async () => {
        try {
          const { user, error } = await getAuthState();
          
          setAuthState(prev => ({
            ...prev,
            user,
            isLoading: false,
            error: error ? new Error(error.message) : null,
          }));
        } catch (error) {
          console.error('Failed to fetch auth state directly:', error);
        }
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  return authState;
} 