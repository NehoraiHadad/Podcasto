'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useSidebar } from './context';

interface SidebarContentWrapperProps {
  children: ReactNode;
}

/**
 * Client component that wraps the content area and adjusts its margin based on sidebar state
 */
export function SidebarContentWrapper({ children }: SidebarContentWrapperProps) {
  const { isCollapsed, isMobileView } = useSidebar();
  
  return (
    <div
      className={cn(
        'flex-1 transition-all duration-300 ease-in-out overflow-auto min-h-screen',
        !isMobileView && (isCollapsed ? 'ml-16' : 'ml-48'),
      )}
    >
      {children}
    </div>
  );
} 