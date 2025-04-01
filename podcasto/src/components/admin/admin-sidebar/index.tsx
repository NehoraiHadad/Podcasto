'use client';

import Link from 'next/link';
import { Radio, Home } from 'lucide-react';
import { SidebarContent } from './content';
import { CollapseButton } from './collapse-button';
import { WidthWrapper } from './width-wrapper';
import { useSidebar } from './context';
import { cn } from '@/lib/utils';

/**
 * Header component for the sidebar
 * This is extracted to use the useSidebar hook
 */
function SidebarHeader() {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="p-4 flex items-center justify-between border-b border-gray-200">
      <Link href="/admin" className={isCollapsed ? "mx-auto" : "flex items-center gap-2 font-semibold"}>
        <Radio className="h-6 w-6" />
        {!isCollapsed && <span className="font-bold text-xl">Admin</span>}
      </Link>
      {!isCollapsed && <CollapseButton />}
    </div>
  );
}

/**
 * Back to site footer link
 */
function BackToSiteLink() {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="border-t border-gray-200 p-4 mt-auto">
      <Link
        href="/"
        className={cn(
          'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
          'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
        title={isCollapsed ? "Back to Site" : undefined}
      >
        <Home className="h-5 w-5" />
        {!isCollapsed && <span className="ml-3">Back to Site</span>}
      </Link>
    </div>
  );
}

/**
 * Main admin sidebar component
 * This is the entry point for the admin sidebar
 */
export function AdminSidebar() {
  return (
    <WidthWrapper>
      <div className="h-full bg-white border-r border-gray-200 flex flex-col relative">
        <SidebarHeader />
        <div className="flex-1 overflow-y-auto">
          <SidebarContent />
        </div>
        <BackToSiteLink />
        <CollapseButtonFixed />
      </div>
    </WidthWrapper>
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
    <div className="absolute top-4 right-0 transform translate-x-1/2">
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