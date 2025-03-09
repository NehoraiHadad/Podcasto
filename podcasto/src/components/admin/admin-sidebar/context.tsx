'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type SidebarContextType = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Storage key for sidebar collapsed state
const STORAGE_KEY = 'podcasto-sidebar-collapsed';

// Custom event name for sidebar state changes
const SIDEBAR_TOGGLE_EVENT = 'podcasto-sidebar-toggle';

/**
 * Provider component for the sidebar context
 * Manages the collapsed state of the sidebar
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  // Initialize with null to avoid hydration mismatch
  const [isCollapsed, setIsCollapsed] = useState<boolean | null>(null);
  
  // Load the collapsed state from localStorage on mount
  useEffect(() => {
    try {
      const storedValue = localStorage.getItem(STORAGE_KEY);
      setIsCollapsed(storedValue === 'true');
    } catch (error) {
      // Fallback to default if localStorage is not available
      setIsCollapsed(false);
      console.error('Failed to access localStorage:', error);
    }
    
    // Listen for sidebar toggle events from other components
    const handleExternalToggle = (event: CustomEvent) => {
      setIsCollapsed(event.detail.isCollapsed);
    };
    
    // Add event listener
    document.addEventListener(
      SIDEBAR_TOGGLE_EVENT, 
      handleExternalToggle as EventListener
    );
    
    // Clean up event listener
    return () => {
      document.removeEventListener(
        SIDEBAR_TOGGLE_EVENT, 
        handleExternalToggle as EventListener
      );
    };
  }, []);
  
  const setSidebarCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
    
    // Dispatch event to notify other components
    document.dispatchEvent(
      new CustomEvent(SIDEBAR_TOGGLE_EVENT, { 
        detail: { isCollapsed: collapsed } 
      })
    );
  };
  
  const toggleSidebar = () => {
    if (isCollapsed !== null) {
      setSidebarCollapsed(!isCollapsed);
    }
  };
  
  // Don't render children until we've loaded the initial state from localStorage
  if (isCollapsed === null) {
    return null;
  }
  
  return (
    <SidebarContext.Provider value={{ 
      isCollapsed, 
      toggleSidebar,
      setSidebarCollapsed
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Hook to access the sidebar context
 * Must be used within a SidebarProvider
 */
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
} 