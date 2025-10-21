'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthButtonsProps {
  showCreateButton?: boolean;
}

/**
 * Authentication buttons component
 * Shows Login and Sign up buttons for unauthenticated users
 * Optionally shows "Create Podcast" CTA button
 */
export function AuthButtons({ showCreateButton = false }: AuthButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      {showCreateButton && (
        <Link href="/podcasts/create" className="hidden sm:block">
          <Button
            variant="default"
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Podcast
          </Button>
        </Link>
      )}
      <Link href="/auth/login">
        <Button
          variant="outline"
          size="sm"
          className="border-primary/20 text-foreground hover:text-primary hover:border-primary/40"
        >
          Login
        </Button>
      </Link>
      <Link href="/auth/signup">
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          Sign up
        </Button>
      </Link>
    </div>
  );
}
