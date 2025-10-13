# Role Management Service

Comprehensive role and permission management system for Podcasto. This service provides centralized role checking, permission validation, and access control with efficient request-level caching.

## Architecture Overview

The role management system consists of three main components:

1. **`permissions.ts`** - Permission definitions and role mappings
2. **`role-service.ts`** - Core role management service with caching
3. **Integration with SessionService** - Unified authentication and authorization

## Core Concepts

### Roles

Roles are assigned to users in the `user_roles` table. Each user can have multiple roles:

- **admin** - Full system access with all permissions
- **moderator** - Content management permissions (podcasts, episodes)
- **user** - Standard user permissions (default)

### Permissions

Permissions are granular capabilities assigned to roles. Examples:

- `podcast:create` - Create new podcasts
- `episode:delete` - Delete episodes
- `admin:panel_access` - Access admin panel
- `*` - Wildcard (all permissions)

### Permission Hierarchy

Roles inherit permissions based on their definition in `ROLE_PERMISSIONS`:

```typescript
ROLE_PERMISSIONS = {
  admin: ['*'],                    // All permissions
  moderator: ['podcast:create', 'episode:delete', ...],
  user: [],                        // No special permissions
}
```

## Caching Strategy

### Request-Level Caching

All role queries use React's `cache()` for automatic request-level caching:

```typescript
export const getUserRoles = cache(async (userId: string) => {
  return await userRolesApi.getUserRoles(userId);
});
```

**Benefits:**
- Eliminates N+1 queries within a single request
- Automatic cache invalidation between requests
- Zero configuration required
- Works seamlessly with React Server Components

**How it works:**
1. First call to `getUserRoles('user-123')` hits the database
2. Subsequent calls in the same request return cached data
3. Cache automatically clears when request completes
4. Next request starts fresh

### Layered Caching

Higher-level functions build on cached base queries:

```typescript
// Base query - cached
getUserRoles(userId) → DB query + cache

// These use cached data:
hasRole(userId, 'admin') → uses cached getUserRoles()
isAdmin(userId) → uses cached hasRole()
hasPermission(userId, permission) → uses cached getUserRoles()
```

This means checking multiple permissions for the same user only hits the database once per request.

## Usage Patterns

### 1. Guard Functions (Recommended for Server Actions)

Guard functions throw errors if checks fail, simplifying server action code:

```typescript
'use server';

export async function deleteEpisode(episodeId: string) {
  // Throws UnauthorizedError if not authenticated
  // Throws InsufficientPermissionsError if not admin
  const admin = await requireAdmin();

  // If we reach here, user is authenticated and is admin
  await episodesApi.deleteEpisode(episodeId);

  return { success: true };
}
```

**Available Guards:**
- `requireAuth()` - Require authentication
- `requireAdmin()` - Require admin role
- `requireRole(role)` - Require specific role
- `requirePermission(permission)` - Require specific permission

**Error Handling:**

Guards throw `AuthenticationError` instances that can be caught and converted to `AuthResult`:

```typescript
import { authErrorToResult } from '@/lib/auth';

try {
  const user = await requireAdmin();
  // ... admin logic
} catch (error) {
  if (error instanceof AuthenticationError) {
    return authErrorToResult(error);
  }
  throw error;
}
```

### 2. Boolean Checks (For UI Logic)

Use boolean checks when you need conditional rendering or flow control:

```typescript
// In a React Server Component
export default async function AdminPanel() {
  const user = await SessionService.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const userIsAdmin = await isAdmin(user.id);

  if (!userIsAdmin) {
    return <div>Access denied</div>;
  }

  return <AdminDashboard />;
}
```

**Available Checks:**
- `hasRole(userId, role)` - Check specific role
- `isAdmin(userId)` - Check admin role (shorthand)
- `hasPermission(userId, permission)` - Check permission

### 3. Detailed Checks (For Complex UI)

Get comprehensive role information for detailed UI logic:

```typescript
export default async function UserProfile({ userId }: Props) {
  const roleCheck = await checkRole(userId, 'moderator');

  return (
    <div>
      <h2>User Role Information</h2>
      <p>Has moderator role: {roleCheck.hasRole ? 'Yes' : 'No'}</p>
      {roleCheck.permissions && (
        <ul>
          {roleCheck.permissions.map(perm => (
            <li key={perm}>{perm}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Available Functions:**
- `checkRole(userId, role)` - Get detailed role info
- `checkPermission(userId, permission)` - Get detailed permission info
- `getUserHighestRole(userId)` - Get user's primary role

### 4. Role Management (Admin Only)

Add or remove roles (automatically checks admin permission):

```typescript
'use server';

export async function promoteToModerator(userId: string) {
  const result = await addUserRole(userId, 'moderator');

  if (!result.success) {
    return result; // Error response
  }

  return {
    success: true,
    message: 'User promoted to moderator'
  };
}

export async function revokeModeratorRole(userId: string) {
  const result = await removeUserRole(userId, 'moderator');

  return result;
}
```

## Integration Examples

### Server Action with Permission Check

```typescript
'use server';

import { requirePermission, PERMISSIONS } from '@/lib/auth';

export async function publishEpisode(episodeId: string) {
  // Require specific permission
  const user = await requirePermission(PERMISSIONS.EPISODE_PUBLISH);

  // Update episode status
  await episodesApi.updateEpisode(episodeId, { status: 'published' });

  return { success: true };
}
```

### Admin Route Protection

```typescript
// app/admin/layout.tsx
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }) {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/unauthorized');
  }

  return <div>{children}</div>;
}
```

### Conditional Feature Display

```typescript
import { SessionService, hasPermission, PERMISSIONS } from '@/lib/auth';

export default async function PodcastActions({ podcastId }) {
  const user = await SessionService.getUser();

  if (!user) return null;

  const canEdit = await hasPermission(user.id, PERMISSIONS.PODCAST_EDIT);
  const canDelete = await hasPermission(user.id, PERMISSIONS.PODCAST_DELETE);

  return (
    <div className="actions">
      {canEdit && <EditButton podcastId={podcastId} />}
      {canDelete && <DeleteButton podcastId={podcastId} />}
    </div>
  );
}
```

### Combined Session and Role Check

```typescript
import { SessionService, RoleService } from '@/lib/auth';

export async function getAuthContext() {
  // Get authentication state
  const authState = await SessionService.getAuthState();

  if (!authState.isAuthenticated || !authState.user) {
    return { isAuthenticated: false };
  }

  // Get role information
  const roles = await RoleService.getUserRoles(authState.user.id);
  const permissions = await RoleService.getUserPermissions(authState.user.id);
  const isAdmin = await RoleService.isAdmin(authState.user.id);

  return {
    isAuthenticated: true,
    user: authState.user,
    roles: roles.map(r => r.role),
    permissions,
    isAdmin,
  };
}
```

## Performance Considerations

### Cache Effectiveness

Within a single request:

```typescript
// Example: Admin dashboard loading
async function loadAdminDashboard(userId: string) {
  // 1. Check if user is admin (DB query)
  const isAdmin = await RoleService.isAdmin(userId);

  // 2. Get all permissions (uses cached roles - no DB query)
  const permissions = await RoleService.getUserPermissions(userId);

  // 3. Check multiple permissions (uses cached roles - no DB queries)
  const canEditPodcasts = await RoleService.hasPermission(userId, PERMISSIONS.PODCAST_EDIT);
  const canDeleteEpisodes = await RoleService.hasPermission(userId, PERMISSIONS.EPISODE_DELETE);

  // Total DB queries: 1 (only the first getUserRoles call)
}
```

### Best Practices

1. **Call guards early** - Execute `requireAuth()` or `requireAdmin()` at the start of server actions
2. **Batch role checks** - Group related permission checks together to maximize cache hits
3. **Avoid role checks in loops** - If checking roles for multiple users, consider fetching all at once
4. **Use guards over boolean checks** - Guards provide better error messages and cleaner code

## Adding New Permissions

To add a new permission:

1. **Add to PERMISSIONS constant:**

```typescript
// src/lib/auth/permissions.ts
export const PERMISSIONS = {
  // ... existing permissions
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
} as const;
```

2. **Assign to roles:**

```typescript
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [PERMISSIONS.ALL],
  moderator: [
    // ... existing permissions
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  user: [],
};
```

3. **Use in code:**

```typescript
import { requirePermission, PERMISSIONS } from '@/lib/auth';

export async function exportAnalytics() {
  await requirePermission(PERMISSIONS.ANALYTICS_EXPORT);
  // ... export logic
}
```

## Adding New Roles

To add a new role:

1. **Add to ROLES constant:**

```typescript
// src/lib/auth/permissions.ts
export const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  EDITOR: 'editor', // New role
  USER: 'user',
} as const;
```

2. **Define permissions:**

```typescript
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // ... existing roles
  [ROLES.EDITOR]: [
    PERMISSIONS.EPISODE_CREATE,
    PERMISSIONS.EPISODE_EDIT,
    PERMISSIONS.PODCAST_VIEW_ALL,
  ],
};
```

3. **Update role hierarchy if needed:**

```typescript
export function getHighestRole(roles: string[]): string | null {
  if (roles.includes(ROLES.ADMIN)) return ROLES.ADMIN;
  if (roles.includes(ROLES.MODERATOR)) return ROLES.MODERATOR;
  if (roles.includes(ROLES.EDITOR)) return ROLES.EDITOR; // Add here
  if (roles.includes(ROLES.USER)) return ROLES.USER;
  return null;
}
```

## Error Handling

All role management operations use the unified error handling system:

```typescript
import {
  UnauthorizedError,
  InsufficientPermissionsError,
  authErrorToResult
} from '@/lib/auth';

export async function adminAction() {
  try {
    const admin = await requireAdmin();
    // ... action logic
    return { success: true };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      console.log('User not authenticated');
      return authErrorToResult(error);
    }

    if (error instanceof InsufficientPermissionsError) {
      console.log('User lacks admin role');
      return authErrorToResult(error);
    }

    throw error; // Re-throw unexpected errors
  }
}
```

## Testing Considerations

The RoleService is designed to be testable:

```typescript
// Mock the database layer
jest.mock('@/lib/db/api', () => ({
  userRolesApi: {
    getUserRoles: jest.fn(),
    isUserAdmin: jest.fn(),
  },
}));

// Test role checks
test('isAdmin returns true for admin users', async () => {
  userRolesApi.getUserRoles.mockResolvedValue([
    { id: '1', user_id: 'user-123', role: 'admin', created_at: new Date() }
  ]);

  const result = await isAdmin('user-123');
  expect(result).toBe(true);
});
```

## Migration Guide

To migrate existing role checks to the new RoleService:

### Before:

```typescript
// Old pattern in admin-actions.ts
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return { success: false, error: 'Unauthorized' };
}

const isAdmin = await userRolesApi.isUserAdmin(user.id);
if (!isAdmin) {
  return { success: false, error: 'Insufficient permissions' };
}
```

### After:

```typescript
// New pattern with RoleService
import { requireAdmin } from '@/lib/auth';

try {
  const admin = await requireAdmin();
  // ... action logic
} catch (error) {
  return authErrorToResult(error);
}
```

## API Reference

### Core Queries

- `getUserRoles(userId)` - Get all user roles
- `hasRole(userId, role)` - Check specific role
- `isAdmin(userId)` - Check admin role
- `hasPermission(userId, permission)` - Check permission
- `getUserPermissions(userId)` - Get all user permissions
- `getUserHighestRole(userId)` - Get primary role

### Guard Functions

- `requireAuth()` - Require authentication
- `requireAdmin()` - Require admin role
- `requireRole(role)` - Require specific role
- `requirePermission(permission)` - Require permission

### Management

- `addUserRole(userId, role)` - Add role (admin only)
- `removeUserRole(userId, role)` - Remove role (admin only)

### Detailed Checks

- `checkRole(userId, role)` - Get detailed role info
- `checkPermission(userId, permission)` - Get detailed permission info

### Utilities

- `hasRolePermission(role, permission)` - Check if role has permission
- `getRolePermissions(role)` - Get role's permissions
- `getHighestRole(roles)` - Get highest priority role
- `isValidRole(role)` - Validate role name

## Constants

### PERMISSIONS

All available permissions organized by resource type.

### ROLES

Standard role definitions (admin, moderator, user).

### ROLE_PERMISSIONS

Mapping of roles to their permissions.

## Future Enhancements

Potential improvements for future iterations:

1. **Long-term caching** - Add Redis/memory cache for role data across requests
2. **Permission inheritance** - Support hierarchical permissions
3. **Dynamic roles** - Load role definitions from database
4. **Audit logging** - Track role changes and permission checks
5. **Rate limiting** - Prevent abuse of permission checks
6. **Role templates** - Predefined role configurations
7. **Time-based roles** - Temporary role assignments
8. **Custom permissions** - User-defined permission system

## Troubleshooting

### Cache not working

**Problem:** Role changes don't reflect immediately

**Solution:** Caching is request-level only. Changes take effect on next request automatically. No cache invalidation needed.

### Permission denied errors

**Problem:** User should have permission but check fails

**Solution:**
1. Verify user has correct role in `user_roles` table
2. Check role spelling matches ROLES constants
3. Verify permission is assigned to role in ROLE_PERMISSIONS

### Multiple roles confusion

**Problem:** User has multiple roles, unclear which permissions apply

**Solution:** User gets combined permissions from ALL assigned roles. Use `getUserPermissions()` to see total permission set.

## Support

For questions or issues with the role management system:

1. Check this documentation
2. Review code examples in `src/lib/auth/`
3. Check existing server actions for patterns
4. Refer to error messages - they're designed to be helpful

---

**Version:** 1.0.0
**Last Updated:** 2025-01-13
**Maintainer:** Authentication Team
