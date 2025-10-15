/**
 * Role Module Types
 *
 * Type definitions for role and permission management.
 */

import type { Permission } from '../permissions';

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
