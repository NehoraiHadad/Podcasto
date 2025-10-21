import { LucideIcon, Radio, Coins } from 'lucide-react';

/**
 * Navigation item configuration
 */
export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  showInDesktop?: boolean;
  showInMobile?: boolean;
}

/**
 * Main navigation items configuration
 * Single source of truth for all navigation links
 */
export const navigationItems: NavItem[] = [
  {
    label: 'Podcasts',
    href: '/podcasts',
    showInDesktop: true,
    showInMobile: true
  },
  {
    label: 'My Podcasts',
    href: '/podcasts/my',
    icon: Radio,
    requiresAuth: true,
    showInDesktop: true,
    showInMobile: true
  },
  {
    label: 'Credits',
    href: '/credits',
    icon: Coins,
    requiresAuth: true,
    showInDesktop: true,
    showInMobile: true
  },
  {
    label: 'About',
    href: '/about',
    showInDesktop: true,
    showInMobile: true
  },
  {
    label: 'Contact',
    href: '/contact',
    showInDesktop: false,
    showInMobile: true
  }
];
