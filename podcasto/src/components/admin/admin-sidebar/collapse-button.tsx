'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSidebar } from './context';

/**
 * Client component for the sidebar collapse button
 * This isolates the interactive part of the sidebar
 * Includes keyboard shortcut support (Alt+S)
 */
export function CollapseButton() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  
  // Add keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+S to toggle sidebar
      if (e.altKey && e.key === 's') {
        toggleSidebar();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);
  
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleSidebar}
      className="transition-transform duration-200 hover:bg-gray-100 shadow-sm z-10 bg-white"
      aria-label={isCollapsed ? "Expand sidebar (Alt+S)" : "Collapse sidebar (Alt+S)"}
      title={isCollapsed ? "Expand sidebar (Alt+S)" : "Collapse sidebar (Alt+S)"}
    >
      {isCollapsed ? (
        <ChevronRight className="h-5 w-5" />
      ) : (
        <ChevronLeft className="h-5 w-5" />
      )}
    </Button>
  );
} 