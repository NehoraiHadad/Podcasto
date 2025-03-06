import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';

/**
 * Creates a Supabase client for use in Client Components
 * This should only be used in Client Components (with 'use client' directive)
 * 
 * @returns A Supabase client configured for browser usage
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// For backward compatibility with existing code
export const supabase = createClient(); 