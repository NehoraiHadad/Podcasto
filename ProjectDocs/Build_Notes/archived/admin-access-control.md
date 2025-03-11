# Admin Access Control System

This document explains how the admin access control system works in the podcasto application.

## Database Structure

The admin access control system relies on a `user_roles` table in the Supabase database with the following structure:

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create an index for faster lookups
CREATE INDEX user_roles_user_id_idx ON user_roles(user_id);

-- Add RLS policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Admin users can read all roles
CREATE POLICY "Admins can read all roles" ON user_roles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Users can read their own role
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Only admins can insert/update/delete roles
CREATE POLICY "Only admins can insert roles" ON user_roles
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

CREATE POLICY "Only admins can update roles" ON user_roles
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete roles" ON user_roles
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );
```

## Server-Side Protection

The admin access control system provides several server-side mechanisms to protect admin routes:

### Middleware

The middleware checks if a user is trying to access an admin route and redirects to the unauthorized page if they don't have admin role:

```typescript
// In middleware.ts
const adminRoutes = ['/admin'];

// In the middleware function
if (user && isAdminRoute) {
  // Check if user has admin role
  const { data: userRoles, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  // If user is not an admin, redirect to unauthorized page
  if (error || !userRoles || userRoles.role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
}
```

### Server Actions

The admin access control system provides several server actions to check if a user has admin role:

#### `requireAdmin`

This server action checks if a user has admin role and redirects to the unauthorized page if not:

```typescript
import { requireAdmin } from '@/lib/actions/auth-actions';

// In a server component or page
await requireAdmin();
```

#### `checkIsAdmin`

This server action checks if a user has admin role and returns a boolean:

```typescript
import { checkIsAdmin } from '@/lib/actions/auth-actions';

// In a server component or page
const isAdmin = await checkIsAdmin();
```

#### `getUserRole`

This server action gets the user's role:

```typescript
import { getUserRole } from '@/lib/actions/auth-actions';

// In a server component or page
const role = await getUserRole();
```

## Client-Side Components

The admin access control system provides several client-side components to conditionally render content based on admin role:

### `AdminGuard`

This component conditionally renders content based on admin role:

```tsx
import { AdminGuard } from '@/components/admin/admin-guard';

// In a client component
<AdminGuard>
  <div>Admin-only content</div>
</AdminGuard>

// With a fallback
<AdminGuard fallback={<div>Not an admin</div>}>
  <div>Admin-only content</div>
</AdminGuard>

// With an initial value
<AdminGuard initialIsAdmin={true}>
  <div>Admin-only content</div>
</AdminGuard>
```

### `AdminNavLink`

This component renders a navigation link only if the user is an admin:

```tsx
import { AdminNavLink } from '@/components/admin/admin-nav-link';

// In a client component
<AdminNavLink href="/admin">
  Admin Dashboard
</AdminNavLink>
```

## Server Components

The admin access control system provides a server component to conditionally render content based on admin role:

### `AdminOnly`

This component conditionally renders content based on admin role:

```tsx
import { AdminOnly } from '@/components/admin/admin-only';

// In a server component
<AdminOnly>
  <div>Admin-only content</div>
</AdminOnly>

// With a fallback
<AdminOnly fallback={<div>Not an admin</div>}>
  <div>Admin-only content</div>
</AdminOnly>
```

## Client-Side Hooks

The admin access control system provides a client-side hook to check if a user has admin role:

### `useAdmin`

This hook checks if a user has admin role:

```tsx
import { useAdmin } from '@/lib/hooks/use-admin';

// In a client component
const { isAdmin, isLoading } = useAdmin();

// With an initial value
const { isAdmin, isLoading } = useAdmin(true);
``` 