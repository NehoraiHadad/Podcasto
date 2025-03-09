'use client';

import Link from 'next/link';
import { Radio } from 'lucide-react';
import { SidebarProvider } from './context';
import { SidebarContent } from './content';
import { CollapseButton } from './collapse-button';
import { WidthWrapper } from './width-wrapper';
import { useSidebar } from './context';

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
 * Main admin sidebar component
 * This is the entry point for the admin sidebar
 */
export function AdminSidebar() {
  return (
    <SidebarProvider>
      <WidthWrapper>
        <div className="h-screen bg-white border-r border-gray-200 flex flex-col relative">
          <SidebarHeader />
          <SidebarContent />
          <CollapseButtonFixed />
        </div>
      </WidthWrapper>
    </SidebarProvider>
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