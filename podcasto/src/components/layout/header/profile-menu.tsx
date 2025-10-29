'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { LayoutDashboard } from 'lucide-react';
import { useOnClickOutside } from 'usehooks-ts';
import { signOut } from '@/lib/actions/auth-actions';
import { AdminNavLink } from '@/components/admin/admin-nav-link';

interface ProfileMenuProps {
  user: User;
  isAdmin: boolean;
}

/**
 * Profile dropdown menu component
 * Shows user profile options, admin dashboard link (if admin), and logout
 */
export function ProfileMenu({ user, isAdmin }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useOnClickOutside(menuRef as React.RefObject<HTMLElement>, () => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const result = await signOut();

      if (!result.success) {
        console.error('Error signing out:', result.error, result.errors);
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ml-3 relative">
      <div>
        <button
          type="button"
          className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          id="user-menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="sr-only">Open user menu</span>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
            {user.email?.[0].toUpperCase() || 'U'}
          </div>
        </button>
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-card ring-1 ring-border focus:outline-none z-10"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
          tabIndex={-1}
        >
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-foreground/90 hover:bg-primary/5 hover:text-primary"
            onClick={() => setIsOpen(false)}
          >
            My Profile
          </Link>

          <AdminNavLink
            href="/admin"
            className="px-4 py-2 text-sm text-foreground/90 hover:bg-primary/5 hover:text-primary w-full inline-flex items-center gap-2"
            isAdmin={isAdmin}
            isLoading={isLoading}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Admin Dashboard</span>
          </AdminNavLink>

          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="block w-full text-left px-4 py-2 text-sm text-foreground/90 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
          >
            {isLoading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      )}
    </div>
  );
}
