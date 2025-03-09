'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AdminNavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  isAdmin: boolean;
  isLoading?: boolean;
}

/**
 * Component that renders a navigation link only if the user is an admin
 * This is a client-side component that accepts an isAdmin prop
 * 
 * @param href The link destination
 * @param children The link content
 * @param className Optional additional CSS classes
 * @param isAdmin Whether the user is an admin
 * @param isLoading Whether the admin status is still loading
 * @returns The link if user is admin, otherwise null
 */
export function AdminNavLink({
  href,
  children,
  className,
  isAdmin,
  isLoading = false,
}: AdminNavLinkProps) {
  // Don't render anything while loading or if user is not admin
  if (isLoading || !isAdmin) {
    return null;
  }
  
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
} 