/**
 * Role Management Service
 *
 * Centralized service for handling role checks and permission management.
 * Implements efficient request-level caching to minimize database queries.
 *
 * Key Features:
 * - Request-level caching via React's cache()
 * - Type-safe role and permission checks
 * - Integration with SessionService
 * - Unified error handling
 * - Extensible permission system
 */

'use server';

import { cache } from 'react';
import { userRolesApi } from '@/lib/db/api';
import { getUser } from './session-service';
import {
  UnauthorizedError,
  InsufficientPermissionsError,
  AuthenticationError,
  AUTH_ERROR_CODES,
} from './errors';
import {
  PERMISSIONS,
  ROLES,
  hasRolePermission,
  getRolePermissions,
  getHighestRole,
  type Permission,
} from './permissions';
import type { AuthResult, User } from './types';
import type { UserRole } from '@/lib/db/api/user-roles';

/**
 * Role check result with detailed information
 */
export interface RoleCheckResult {
  hasRole: boolean;
  role?: string;
  userId: string;
  permissions?: Permission[];
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  userId: string;
  permission: Permission;
  grantingRole?: string;
}

// ============================================================================
// Core Role Queries (Cached)
// ============================================================================

/**
 * Get all roles for a user (cached per request)
 *
 * This is the foundation of the role system. All other role checks
 * build on this cached query to avoid N+1 database queries.
 *
 * @param userId - The user ID to get roles for
 * @returns Array of user role records
 *
 * @example
 * ```typescript
 * const roles = await getUserRoles('user-123');
 * console.log(`User has ${roles.length} roles`);
 * ```
 */
export const getUserRoles = cache(
  async (userId: string): Promise<UserRole[]> => {
    try {
      return await userRolesApi.getUserRoles(userId);
    } catch (error) {
      console.error('[RoleService] Error fetching user roles:', error);
      return [];
    }
  }
);

/**
 * Check if user has a specific role (cached per request)
 *
 * @param userId - The user ID to check
 * @param role - The role name to check for
 * @returns True if user has the role
 *
 * @example
 * ```typescript
 * const hasAdmin = await hasRole('user-123', 'admin');
 * if (hasAdmin) {
 *   // Grant admin access
 * }
 * ```
 */
export const hasRole = cache(
  async (userId: string, role: string): Promise<boolean> => {
    const roles = await getUserRoles(userId);
    return roles.some((r) => r.role === role);
  }
);

/**
 * Check if user is an admin (cached per request)
 *
 * Convenience method for the common admin check.
 *
 * @param userId - The user ID to check
 * @returns True if user has admin role
 *
 * @example
 * ```typescript
 * const isAdmin = await isAdmin('user-123');
 * if (isAdmin) {
 *   // Show admin features
 * }
 * ```
 */
export const isAdmin = cache(async (userId: string): Promise<boolean> => {
  return await hasRole(userId, ROLES.ADMIN);
});

/**
 * Check if user has a specific permission (cached per request)
 *
 * Checks all user roles for the permission. Supports wildcard permissions.
 *
 * @param userId - The user ID to check
 * @param permission - The permission to verify
 * @returns True if user has the permission through any role
 *
 * @example
 * ```typescript
 * const canDelete = await hasPermission('user-123', PERMISSIONS.EPISODE_DELETE);
 * if (canDelete) {
 *   // Allow deletion
 * }
 * ```
 */
export const hasPermission = cache(
  async (userId: string, permission: Permission): Promise<boolean> => {
    const roles = await getUserRoles(userId);

    if (roles.length === 0) {
      return false;
    }

    // Check if any role grants this permission
    return roles.some((userRole) =>
      hasRolePermission(userRole.role, permission)
    );
  }
);

/**
 * Get all permissions for a user (cached per request)
 *
 * Aggregates permissions from all user roles.
 *
 * @param userId - The user ID to get permissions for
 * @returns Array of unique permissions
 *
 * @example
 * ```typescript
 * const perms = await getUserPermissions('user-123');
 * console.log(`User has ${perms.length} permissions`);
 * ```
 */
export const getUserPermissions = cache(
  async (userId: string): Promise<Permission[]> => {
    const roles = await getUserRoles(userId);

    if (roles.length === 0) {
      return [];
    }

    // Collect all permissions from all roles
    const allPermissions = roles.flatMap((userRole) =>
      getRolePermissions(userRole.role)
    );

    // If any role has wildcard, return all permissions
    if (allPermissions.includes(PERMISSIONS.ALL)) {
      return [PERMISSIONS.ALL];
    }

    // Return unique permissions
    return Array.from(new Set(allPermissions));
  }
);

// ============================================================================
// Guard Functions (Throw on Failure)
// ============================================================================

/**
 * Require user to be authenticated
 *
 * Throws UnauthorizedError if not authenticated.
 * Use this at the start of protected server actions.
 *
 * @returns The authenticated user
 * @throws {UnauthorizedError} If user is not authenticated
 *
 * @example
 * ```typescript
 * export async function protectedAction() {
 *   const user = await requireAuth();
 *   // User is guaranteed to exist here
 * }
 * ```
 */
export async function requireAuth(): Promise<User> {
  const user = await getUser();

  if (!user) {
    throw new UnauthorizedError({
      action: 'requireAuth',
      timestamp: Date.now(),
    });
  }

  return user;
}

/**
 * Require user to be an admin
 *
 * Throws errors if not authenticated or not admin.
 * Use this at the start of admin-only server actions.
 *
 * @returns The authenticated admin user
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {InsufficientPermissionsError} If user is not an admin
 *
 * @example
 * ```typescript
 * export async function deleteUser(userId: string) {
 *   const admin = await requireAdmin();
 *   // User is guaranteed to be an admin here
 * }
 * ```
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();

  const userIsAdmin = await isAdmin(user.id);

  if (!userIsAdmin) {
    throw new InsufficientPermissionsError({
      userId: user.id,
      requiredRole: ROLES.ADMIN,
      action: 'requireAdmin',
    });
  }

  return user;
}

/**
 * Require user to have a specific role
 *
 * Throws errors if not authenticated or doesn't have the role.
 *
 * @param role - The required role
 * @returns The authenticated user
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {InsufficientPermissionsError} If user doesn't have the role
 *
 * @example
 * ```typescript
 * export async function moderateContent() {
 *   const user = await requireRole('moderator');
 *   // User is guaranteed to have moderator role
 * }
 * ```
 */
export async function requireRole(role: string): Promise<User> {
  const user = await requireAuth();

  const userHasRole = await hasRole(user.id, role);

  if (!userHasRole) {
    throw new InsufficientPermissionsError({
      userId: user.id,
      requiredRole: role,
      action: 'requireRole',
    });
  }

  return user;
}

/**
 * Require user to have a specific permission
 *
 * Throws errors if not authenticated or doesn't have the permission.
 *
 * @param permission - The required permission
 * @returns The authenticated user
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {InsufficientPermissionsError} If user doesn't have permission
 *
 * @example
 * ```typescript
 * export async function deleteEpisode(id: string) {
 *   const user = await requirePermission(PERMISSIONS.EPISODE_DELETE);
 *   // User is guaranteed to have delete permission
 * }
 * ```
 */
export async function requirePermission(permission: Permission): Promise<User> {
  const user = await requireAuth();

  const userHasPermission = await hasPermission(user.id, permission);

  if (!userHasPermission) {
    throw new InsufficientPermissionsError({
      userId: user.id,
      requiredPermission: permission,
      action: 'requirePermission',
    });
  }

  return user;
}

// ============================================================================
// Role Management Operations
// ============================================================================

/**
 * Add a role to a user
 *
 * @param userId - The user ID to add role to
 * @param role - The role to add
 * @returns AuthResult with the created role record
 *
 * @example
 * ```typescript
 * const result = await addUserRole('user-123', 'moderator');
 * if (result.success) {
 *   console.log('Role added successfully');
 * }
 * ```
 */
export async function addUserRole(
  userId: string,
  role: string
): Promise<AuthResult<UserRole>> {
  try {
    // Verify requester is admin
    await requireAdmin();

    // Check if user already has this role
    const existingRoles = await getUserRoles(userId);
    const hasExistingRole = existingRoles.some((r) => r.role === role);

    if (hasExistingRole) {
      return {
        success: false,
        error: {
          message: 'User already has this role',
          code: AUTH_ERROR_CODES.UNKNOWN_ERROR,
        },
      };
    }

    // Create the role
    const newRole = await userRolesApi.createUserRole({
      user_id: userId,
      role,
    });

    return {
      success: true,
      data: newRole,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      };
    }

    console.error('[RoleService] Error adding user role:', error);
    return {
      success: false,
      error: {
        message: 'Failed to add user role',
        code: AUTH_ERROR_CODES.INTERNAL_ERROR,
      },
    };
  }
}

/**
 * Remove a role from a user
 *
 * @param userId - The user ID to remove role from
 * @param role - The role to remove
 * @returns AuthResult indicating success or failure
 *
 * @example
 * ```typescript
 * const result = await removeUserRole('user-123', 'moderator');
 * if (result.success) {
 *   console.log('Role removed successfully');
 * }
 * ```
 */
export async function removeUserRole(
  userId: string,
  role: string
): Promise<AuthResult> {
  try {
    // Verify requester is admin
    await requireAdmin();

    // Find the role record
    const roles = await getUserRoles(userId);
    const roleToRemove = roles.find((r) => r.role === role);

    if (!roleToRemove) {
      return {
        success: false,
        error: {
          message: 'User does not have this role',
          code: AUTH_ERROR_CODES.UNKNOWN_ERROR,
        },
      };
    }

    // Delete the role
    const deleted = await userRolesApi.deleteUserRole(roleToRemove.id);

    if (!deleted) {
      return {
        success: false,
        error: {
          message: 'Failed to remove role',
          code: AUTH_ERROR_CODES.INTERNAL_ERROR,
        },
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      };
    }

    console.error('[RoleService] Error removing user role:', error);
    return {
      success: false,
      error: {
        message: 'Failed to remove user role',
        code: AUTH_ERROR_CODES.INTERNAL_ERROR,
      },
    };
  }
}

// ============================================================================
// Detailed Check Functions (for UI Logic)
// ============================================================================

/**
 * Get detailed role check result
 *
 * Returns comprehensive information about a user's role status.
 * Useful for UI components that need to display role information.
 *
 * @param userId - The user ID to check
 * @param role - The role to check for
 * @returns Detailed role check result
 *
 * @example
 * ```typescript
 * const result = await checkRole('user-123', 'admin');
 * if (result.hasRole) {
 *   console.log(`User has ${result.role} role`);
 * }
 * ```
 */
export async function checkRole(
  userId: string,
  role: string
): Promise<RoleCheckResult> {
  const userHasRole = await hasRole(userId, role);
  const permissions = userHasRole ? getRolePermissions(role) : undefined;

  return {
    hasRole: userHasRole,
    role: userHasRole ? role : undefined,
    userId,
    permissions,
  };
}

/**
 * Get detailed permission check result
 *
 * Returns comprehensive information about a user's permission status.
 *
 * @param userId - The user ID to check
 * @param permission - The permission to check for
 * @returns Detailed permission check result
 *
 * @example
 * ```typescript
 * const result = await checkPermission('user-123', PERMISSIONS.EPISODE_DELETE);
 * if (result.hasPermission) {
 *   console.log(`Permission granted by ${result.grantingRole} role`);
 * }
 * ```
 */
export async function checkPermission(
  userId: string,
  permission: Permission
): Promise<PermissionCheckResult> {
  const roles = await getUserRoles(userId);

  // Find which role grants this permission
  const grantingRole = roles.find((userRole) =>
    hasRolePermission(userRole.role, permission)
  );

  return {
    hasPermission: !!grantingRole,
    userId,
    permission,
    grantingRole: grantingRole?.role,
  };
}

/**
 * Get user's highest priority role
 *
 * @param userId - The user ID to get role for
 * @returns The highest priority role or null
 *
 * @example
 * ```typescript
 * const role = await getUserHighestRole('user-123');
 * console.log(`User's primary role: ${role}`);
 * ```
 */
export async function getUserHighestRole(
  userId: string
): Promise<string | null> {
  const roles = await getUserRoles(userId);
  const roleNames = roles.map((r) => r.role);
  return getHighestRole(roleNames);
}

/**
 * RoleService namespace export for cleaner imports
 *
 * NOTE: This export is commented out to avoid "use server" conflicts in Next.js.
 * In "use server" files, you can only export async functions, not objects.
 *
 * Instead, import individual functions:
 * import { requireAdmin, isAdmin, hasPermission } from '@/lib/auth';
 */
// export const RoleService = {
//   // Core queries
//   getUserRoles,
//   hasRole,
//   isAdmin,
//   hasPermission,
//   getUserPermissions,
//   getUserHighestRole,
//
//   // Guards
//   requireAuth,
//   requireAdmin,
//   requireRole,
//   requirePermission,
//
//   // Management
//   addUserRole,
//   removeUserRole,
//
//   // Detailed checks
//   checkRole,
//   checkPermission,
//
//   // Re-export constants for convenience
//   PERMISSIONS,
//   ROLES,
// } as const;
