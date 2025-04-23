/**
 * Theme configuration
 * 
 * This file contains theme-related constants and utilities for the Podcasto app.
 * It centralizes color definitions and theme configuration.
 */

type ColorMode = 'light' | 'dark';

// Logo-inspired color palette
export const colors = {
  // Primary colors from logo
  primary: {
    pink: '#e279c7',  // Pink/purple from logo
    blue: '#7eb5df',  // Blue/teal from logo
  },
  
  // Extended palette
  light: {
    background: '#fafbfc',
    foreground: '#1e1e2a',
    muted: '#f5f5f7',
    mutedForeground: '#71717a',
    border: '#e2e8f0',
    primaryLight: '#f0d7eb',
    secondaryLight: '#d1e6f7', 
  },
  
  dark: {
    background: '#121219',
    foreground: '#f8f9fa',
    muted: '#27272e',
    mutedForeground: '#a1a1aa',
    border: '#2d2d3a',
    primaryDark: '#6e3c62',
    secondaryDark: '#385a7c',
  }
};

// Gradient definitions
export const gradients = {
  primaryGradient: `linear-gradient(to right, ${colors.primary.pink}, ${colors.primary.blue})`,
  subtleGradient: 'linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0))',
  darkSubtleGradient: 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0))',
};

// Shadow definitions
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
};

// Animation definitions
export const animations = {
  fadeIn: 'fade-in 0.3s ease-in-out',
  slideUp: 'slide-up 0.3s ease-out',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
};

// Border radius values
export const radius = {
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px',  // Circular
};

// Helper function to get color based on mode
export const getThemeColor = (colorKey: string, mode: ColorMode = 'light') => {
  const colorGroup = mode === 'light' ? colors.light : colors.dark;
  return colorGroup[colorKey as keyof typeof colorGroup] || colors.primary[colorKey as keyof typeof colors.primary];
}; 