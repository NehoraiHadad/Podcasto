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
  const { isCollapsed } = useSidebar();
  
  return (
    <div
      className={cn(
        'h-screen transition-all duration-300 ease-in-out overflow-visible',
        isCollapsed ? 'w-16' : 'w-64'
      )}
      data-state={isCollapsed ? 'collapsed' : 'expanded'}
    >
      {children}
    </div>
  );
} 