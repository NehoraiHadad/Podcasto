'use server';

/**
 * Role Checks
 *
 * Detailed role and permission check functions that return comprehensive information.
 * Useful for UI components that need to display role/permission status.
 */import {
  hasRolePermission,
  getRolePermissions,
  getHighestRole,
  type Permission,
} from '../permissions';
import { getUserRoles, hasRole } from './queries';
import type { RoleCheckResult, PermissionCheckResult } from './types';

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
