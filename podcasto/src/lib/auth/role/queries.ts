/**
 * Role Queries
 *
 * Read-only role query functions with request-level caching.
 * All queries use React's cache() for performance optimization.
 */

'use server';

import { cache } from 'react';
import { userRolesApi } from '@/lib/db/api';
import {
  PERMISSIONS,
  ROLES,
  hasRolePermission,
  getRolePermissions,
  type Permission,
} from '../permissions';
import type { UserRole } from '@/lib/db/api/user-roles';

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
      console.error('[RoleQueries] Error fetching user roles:', error);
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
 * const isUserAdmin = await isAdmin('user-123');
 * if (isUserAdmin) {
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
