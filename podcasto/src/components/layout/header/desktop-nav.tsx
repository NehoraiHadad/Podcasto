'use client';

import { User } from '@supabase/supabase-js';
import { NavLink } from './nav-link';
import { navigationItems } from './navigation-items';

interface DesktopNavProps {
  user: User | null;
  isAdmin: boolean;
}

/**
 * Desktop navigation component
 * Filters navigation items based on user authentication and admin status
 */
export function DesktopNav({ user, isAdmin }: DesktopNavProps) {
  const visibleItems = navigationItems.filter(item => {
    // Show only desktop items
    if (!item.showInDesktop) return false;

    // Filter by auth requirement
    if (item.requiresAuth && !user) return false;

    // Filter by admin requirement
    if (item.requiresAdmin && !isAdmin) return false;

    return true;
  });

  return (
    <nav className="hidden md:flex items-center gap-1">
      {visibleItems.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          variant="desktop"
        />
      ))}
    </nav>
  );
}
