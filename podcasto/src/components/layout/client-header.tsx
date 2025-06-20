'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from '@/lib/actions/auth-actions';
import { Button } from '@/components/ui/button';
import { useOnClickOutside } from 'usehooks-ts';
import { AdminNavLink } from '@/components/admin/admin-nav-link';
import { LayoutDashboard } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface ClientHeaderProps {
  initialIsAdmin: boolean;
  initialUser: User | null;
}

export function ClientHeader({ initialIsAdmin, initialUser }: ClientHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Update admin status when user changes
  useEffect(() => {
    setIsAdmin(initialIsAdmin);
    setUser(initialUser);
  }, [initialUser, initialIsAdmin]);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      setUser(null);
      setIsProfileMenuOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use the useOnClickOutside hook from usehooks-ts for profile menu
  useOnClickOutside(profileMenuRef as React.RefObject<HTMLElement>, () => {
    if (isProfileMenuOpen) {
      setIsProfileMenuOpen(false);
    }
  });

  // Use the useOnClickOutside hook for mobile menu
  useOnClickOutside(mobileMenuRef as React.RefObject<HTMLElement>, () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  });

  return (
    <header className="bg-background border-b border-border/40 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/podcasto-logo.webp"
                  alt="Podcasto Logo"
                  width={150}
                  height={48}
                  quality={100}
                  priority
                  style={{
                    width: 'auto',
                    height: '32px',
                    color: 'transparent'
                  }}
                  className="mb-0 md:mb-2"
                />
              </Link>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-4 items-center">
              <Link
                href="/podcasts"
                className="text-foreground/90 hover:text-primary hover:bg-primary/5 px-3 py-2.5 text-base font-medium rounded-md transition-colors"
              >
                Podcasts
              </Link>
              <Link
                href="/about"
                className="text-foreground/90 hover:text-primary hover:bg-primary/5 px-3 py-2.5 text-base font-medium rounded-md transition-colors"
              >
                About
              </Link>
            </nav>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center">
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
            ) : user ? (
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    id="user-menu-button"
                    aria-expanded={isProfileMenuOpen}
                    aria-haspopup="true"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {user.email?.[0].toUpperCase() || 'U'}
                    </div>
                  </button>
                </div>
                {isProfileMenuOpen && (
                  <div
                    ref={profileMenuRef}
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-card ring-1 ring-border focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    tabIndex={-1}
                  >
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-foreground/90 hover:bg-primary/5 hover:text-primary"
                      onClick={() => setIsProfileMenuOpen(false)}
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
                      className="block w-full text-left px-4 py-2 text-sm text-foreground/90 hover:bg-primary/5 hover:text-primary"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link href="/auth/login">
                  <Button variant="outline" className="border-primary/20 text-foreground hover:text-primary hover:border-primary/40">Login</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-primary hover:bg-primary/90">Sign up</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden ml-4">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-foreground/70 hover:text-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {/* Icon when menu is closed */}
                <svg
                  className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                {/* Icon when menu is open */}
                <svg
                  className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu" ref={mobileMenuRef}>
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/podcasts"
              className="block px-3 py-2 text-base font-medium text-foreground/90 hover:text-primary hover:bg-primary/5 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Podcasts
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 text-base font-medium text-foreground/90 hover:text-primary hover:bg-primary/5 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block px-3 py-2 text-base font-medium text-foreground/90 hover:text-primary hover:bg-primary/5 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
            {isAdmin && !isLoading && (
              <Link
                href="/admin"
                className="px-3 py-2 text-base font-medium text-foreground/90 hover:text-primary hover:bg-primary/5 rounded-md flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Admin Dashboard</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 