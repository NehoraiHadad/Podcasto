'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Headphones, 
  Radio, 
  Users, 
  Settings, 
  PlusCircle,
  BarChart,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from './context';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  exact: boolean;
  children?: {
    title: string;
    href: string;
    icon: React.ReactNode;
  }[];
}

/**
 * Client component for the sidebar content
 * This handles the collapsible state and active link highlighting
 */
export function SidebarContent() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  
  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard className="h-5 w-5" />,
      exact: true,
    },
    {
      title: 'Podcasts',
      href: '/admin/podcasts',
      icon: <Headphones className="h-5 w-5" />,
      exact: false,
      children: [
        {
          title: 'Create Podcast',
          href: '/admin/podcasts/create',
          icon: <PlusCircle className="h-4 w-4" />,
        },
      ],
    },
    {
      title: 'Episodes',
      href: '/admin/episodes',
      icon: <Radio className="h-5 w-5" />,
      exact: false,
    },
    {
      title: 'Users',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
      exact: false,
    },
    {
      title: 'Analytics',
      href: '/admin/analytics',
      icon: <BarChart className="h-5 w-5" />,
      exact: false,
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
      exact: false,
    },
  ];
  
  const isActive = (item: { href: string; exact: boolean }) => {
    if (item.exact) {
      return pathname === item.href;
    }
    
    // Check if the current path starts with the item's href
    // But make sure we're not matching partial segments
    if (pathname.startsWith(item.href)) {
      // Make sure it's a complete segment match
      // Either the path is exactly the same, or the next character is a slash
      const nextChar = pathname.charAt(item.href.length);
      return nextChar === '' || nextChar === '/';
    }
    
    return false;
  };
  
  // Check if any child of an item is active
  const hasActiveChild = (item: NavItem) => {
    return item.children?.some(child => pathname === child.href) || false;
  };
  
  return (
    <div className="flex-1 flex flex-col">
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const active = isActive(item) || hasActiveChild(item);
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    active
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  {item.icon}
                  {!isCollapsed && <span className="ml-3">{item.title}</span>}
                </Link>
                
                {!isCollapsed && item.children && (
                  <ul className="mt-1 ml-6 space-y-1">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href;
                      
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                              childActive
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                          >
                            {child.icon}
                            <span className="ml-3">{child.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
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
    </div>
  );
} 