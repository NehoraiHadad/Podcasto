'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';

/**
 * Hook to check if the current user has admin role
 * This is a client-side hook that fetches the user's role from Supabase
 * 
 * @param initialIsAdmin Optional initial value for isAdmin
 * @returns Object with isAdmin flag and loading state
 */
export function useAdmin(initialIsAdmin?: boolean) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(initialIsAdmin ?? false);
  const [isLoading, setIsLoading] = useState<boolean>(!initialIsAdmin);
  const supabase = createClient();
  
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }
    
    // Skip if we already have the initial value
    if (initialIsAdmin !== undefined) {
      setIsLoading(false);
      return;
    }
    
    const checkAdminRole = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminRole();
  }, [user, initialIsAdmin, supabase]);
  
  return { isAdmin, isLoading };
} 