'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  variant?: 'desktop' | 'mobile';
}

/**
 * Reusable navigation link component with active state detection
 * Supports both desktop and mobile variants
 */
export function NavLink({
  href,
  label,
  icon: Icon,
  onClick,
  variant = 'desktop'
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (variant === 'mobile') {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-foreground hover:bg-muted'
        )}
      >
        {Icon && <Icon className="h-5 w-5" />}
        <span className="font-medium">{label}</span>
      </Link>
    );
  }

  // Desktop variant
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{label}</span>
    </Link>
  );
}
