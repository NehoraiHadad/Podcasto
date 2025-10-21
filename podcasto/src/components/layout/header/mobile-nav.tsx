'use client';

import { useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnClickOutside } from 'usehooks-ts';
import { NavLink } from './nav-link';
import { navigationItems } from './navigation-items';

interface MobileNavProps {
  user: User | null;
  isAdmin: boolean;
}

/**
 * Mobile navigation component with hamburger menu
 * Filters navigation items based on user authentication and admin status
 */
export function MobileNav({ user, isAdmin }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useOnClickOutside(menuRef as React.RefObject<HTMLElement>, () => {
    if (open) {
      setOpen(false);
    }
  });

  const visibleItems = navigationItems.filter(item => {
    // Show only mobile items
    if (!item.showInMobile) return false;

    // Filter by auth requirement
    if (item.requiresAuth && !user) return false;

    // Filter by admin requirement
    if (item.requiresAdmin && !isAdmin) return false;

    return true;
  });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Mobile menu dropdown */}
      {open && (
        <div
          ref={menuRef}
          className="absolute top-16 left-0 right-0 bg-background border-b border-border shadow-lg md:hidden z-50"
        >
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {visibleItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                variant="mobile"
                onClick={() => setOpen(false)}
              />
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
