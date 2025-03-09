# Admin Sidebar

This directory contains the components for the admin sidebar.

## Structure

- `index.tsx` - Main entry point that exports the `AdminSidebar` component and re-exports all other components
- `context.tsx` - Provides the sidebar context and the `useSidebar` hook for managing the collapsed state
- `content.tsx` - Contains the sidebar content with navigation links
- `collapse-button.tsx` - Button component for collapsing/expanding the sidebar
- `width-wrapper.tsx` - Wrapper component that handles the width transition of the sidebar

## Usage

```tsx
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default function Layout({ children }) {
  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
```

## Advanced Usage

You can also import individual components if needed:

```tsx
import { 
  SidebarProvider, 
  SidebarContent, 
  CollapseButton, 
  WidthWrapper,
  useSidebar
} from '@/components/admin/admin-sidebar';
```

## Notes

This sidebar implementation uses:
- React Context for state management
- localStorage for persisting the collapsed state
- CSS transitions for smooth animations
- Next.js App Router patterns (client components with 'use client' directive) 