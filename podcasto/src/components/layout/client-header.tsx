'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DesktopNav } from './header/desktop-nav';
import { MobileNav } from './header/mobile-nav';
import { ProfileMenu } from './header/profile-menu';
import { AuthButtons } from './header/auth-buttons';
import { useSupabase } from '@/components/providers/supabase-provider';

interface ClientHeaderProps {
  initialIsAdmin: boolean;
}

/**
 * Main header component
 * Uses modular sub-components for navigation, profile menu, and auth buttons
 */
export function ClientHeader({ initialIsAdmin }: ClientHeaderProps) {
  const { user } = useSupabase();
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    setIsAdmin(initialIsAdmin);
  }, [initialIsAdmin, user]);

  return (
    <header className="bg-background border-b border-border/40 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center">
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

            <DesktopNav user={user} isAdmin={isAdmin} />
          </div>

          {/* Right Side: Auth Buttons or Profile Menu */}
          <div className="flex items-center gap-4">
            {user ? (
              <ProfileMenu user={user} isAdmin={isAdmin} />
            ) : (
              <AuthButtons showCreateButton={false} />
            )}

            {/* Mobile Navigation */}
            <MobileNav user={user} isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </header>
  );
}
