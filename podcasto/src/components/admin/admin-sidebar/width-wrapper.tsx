'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useSidebar } from './context';

interface WidthWrapperProps {
  children: ReactNode;
}

/**
 * Client component that wraps the sidebar and handles its width based on collapsed state
 * Provides smooth transition animation between states
 */
export function WidthWrapper({ children }: WidthWrapperProps) {
  const { isCollapsed, isMobileView, isOpen } = useSidebar();
  
  return (
    <div
      className={cn(
        'h-screen transition-all duration-300 ease-in-out',
        {
          'w-16': isCollapsed && !isMobileView,
          'w-48': !isCollapsed && !isMobileView,
          'w-0 invisible': isMobileView && !isOpen,
          'w-3/4 max-w-xs': isMobileView && isOpen
        }
      )}
      data-state={isCollapsed ? 'collapsed' : 'expanded'}
      data-mobile={isMobileView ? 'true' : 'false'}
      data-open={isOpen ? 'true' : 'false'}
    >
      {children}
    </div>
  );
} 