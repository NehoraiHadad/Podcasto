'use client';

import Link from 'next/link';
import { Radio, Home, Menu, X } from 'lucide-react';
import { SidebarContent } from './content';
import { CollapseButton } from './collapse-button';
import { WidthWrapper } from './width-wrapper';
import { useSidebar } from './context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Header component for the sidebar
 * This is extracted to use the useSidebar hook
 */
function SidebarHeader() {
  const { isCollapsed, toggleSidebar, isMobileView } = useSidebar();
  
  return (
    <div className="p-4 flex items-center justify-between border-b border-gray-200">
      <Link href="/admin" className={isCollapsed && !isMobileView ? "mx-auto" : "flex items-center gap-2 font-semibold"}>
        <Radio className="h-6 w-6" />
        {(!isCollapsed || isMobileView) && <span className="font-bold text-xl">Admin</span>}
      </Link>
      {!isMobileView && !isCollapsed && <CollapseButton />}
      {isMobileView && (
        <Button
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

/**
 * Back to site footer link
 */
function BackToSiteLink() {
  const { isCollapsed, isMobileView } = useSidebar();
  
  return (
    <div className="border-t border-gray-200 p-4 mt-auto">
      <Link
        href="/"
        className={cn(
          'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
          'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
        title={isCollapsed && !isMobileView ? "Back to Site" : undefined}
      >
        <Home className="h-5 w-5" />
        {(!isCollapsed || isMobileView) && <span className="ml-3">Back to Site</span>}
      </Link>
    </div>
  );
}

/**
 * Mobile menu toggle button (appears in the fixed header on mobile)
 */
function MobileMenuButton() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleSidebar}
      className="fixed top-3 left-3 z-40 md:hidden bg-white/80 backdrop-blur-sm shadow-sm rounded-full h-9 w-9 flex items-center justify-center"
      aria-label="Open menu"
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
}

/**
 * Main admin sidebar component
 * This is the entry point for the admin sidebar
 */
export function AdminSidebar() {
  const { isCollapsed, isMobileView, isOpen, toggleSidebar } = useSidebar();

  return (
    <>
      {/* Mobile menu toggle button (visible only on mobile) */}
      {!isOpen && <MobileMenuButton />}
      
      {/* Backdrop for mobile (shown only when sidebar is open on mobile) */}
      {isMobileView && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden" 
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* The sidebar should be above the backdrop */}
      <div className={cn(
        "fixed h-screen z-10", 
        isOpen ? "z-30" : "-z-10 md:z-10",
        isMobileView && !isOpen && "opacity-0"
      )}>
        <WidthWrapper>
          <div className={cn(
            "h-screen bg-white border-r border-gray-200 flex flex-col relative",
            isMobileView && "shadow-xl"
          )}>
            <SidebarHeader />
            <div className="flex-1 overflow-y-auto">
              <SidebarContent />
            </div>
            <BackToSiteLink />
            {!isMobileView && isCollapsed && <CollapseButtonFixed />}
          </div>
        </WidthWrapper>
      </div>
    </>
  );
}

/**
 * Fixed position collapse button that's always visible
 * Only shown when sidebar is collapsed
 */
function CollapseButtonFixed() {
  const { isCollapsed } = useSidebar();
  
  if (!isCollapsed) {
    return null;
  }
  
  return (
    <div className="absolute top-2.5 right-0 transform translate-x-1/2">
      <CollapseButton />
    </div>
  );
}

// Export all sidebar components for direct access if needed
export { SidebarProvider } from './context';
export { SidebarContent } from './content';
export { CollapseButton } from './collapse-button';
export { WidthWrapper } from './width-wrapper';
export { useSidebar } from './context'; 