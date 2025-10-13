/**
 * Permission System
 *
 * Defines the permission hierarchy and role mappings for the application.
 * This provides a flexible, extensible permission system that can grow
 * with application requirements.
 */

/**
 * Permission constants
 *
 * Organized by resource type for clarity. Follows the pattern:
 * RESOURCE_ACTION (e.g., PODCAST_CREATE, EPISODE_DELETE)
 */
export const PERMISSIONS = {
  // Podcast permissions
  PODCAST_CREATE: 'podcast:create',
  PODCAST_EDIT: 'podcast:edit',
  PODCAST_DELETE: 'podcast:delete',
  PODCAST_VIEW_ALL: 'podcast:view_all',

  // Episode permissions
  EPISODE_CREATE: 'episode:create',
  EPISODE_EDIT: 'episode:edit',
  EPISODE_DELETE: 'episode:delete',
  EPISODE_PUBLISH: 'episode:publish',
  EPISODE_VIEW_ALL: 'episode:view_all',

  // User management permissions
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  USER_VIEW_ALL: 'user:view_all',

  // Role management permissions
  ROLE_ASSIGN: 'role:assign',
  ROLE_REMOVE: 'role:remove',

  // Subscription permissions
  SUBSCRIPTION_VIEW_ALL: 'subscription:view_all',
  SUBSCRIPTION_MANAGE: 'subscription:manage',

  // Admin panel permissions
  ADMIN_PANEL_ACCESS: 'admin:panel_access',
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_LOGS: 'admin:logs',

  // Wildcard (all permissions)
  ALL: '*',
} as const;

/**
 * Permission type derived from PERMISSIONS constant
 */
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Role definitions
 *
 * Standard roles available in the system. Can be extended by adding
 * new entries to user_roles table.
 */
export const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
} as const;

/**
 * Role type derived from ROLES constant
 */
export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Role to permissions mapping
 *
 * Defines which permissions each role has. Admin gets all permissions
 * via wildcard. Other roles have specific permission sets.
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // Admin has all permissions
  [ROLES.ADMIN]: [PERMISSIONS.ALL],

  // Moderator can manage content but not users/roles
  [ROLES.MODERATOR]: [
    PERMISSIONS.PODCAST_CREATE,
    PERMISSIONS.PODCAST_EDIT,
    PERMISSIONS.PODCAST_VIEW_ALL,
    PERMISSIONS.EPISODE_CREATE,
    PERMISSIONS.EPISODE_EDIT,
    PERMISSIONS.EPISODE_DELETE,
    PERMISSIONS.EPISODE_PUBLISH,
    PERMISSIONS.EPISODE_VIEW_ALL,
    PERMISSIONS.SUBSCRIPTION_VIEW_ALL,
    PERMISSIONS.ADMIN_PANEL_ACCESS,
  ],

  // Regular users have basic permissions
  [ROLES.USER]: [],
};

/**
 * Check if a role has a specific permission
 *
 * @param role - The role to check
 * @param permission - The permission to verify
 * @returns True if the role has the permission
 *
 * @example
 * ```typescript
 * if (hasRolePermission('admin', PERMISSIONS.EPISODE_DELETE)) {
 *   // Allow deletion
 * }
 * ```
 */
export function hasRolePermission(role: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role];

  if (!rolePermissions || rolePermissions.length === 0) {
    return false;
  }

  // Check for wildcard permission
  if (rolePermissions.includes(PERMISSIONS.ALL)) {
    return true;
  }

  // Check for specific permission
  return rolePermissions.includes(permission);
}

/**
 * Get all permissions for a role
 *
 * @param role - The role to get permissions for
 * @returns Array of permissions for the role
 *
 * @example
 * ```typescript
 * const perms = getRolePermissions('moderator');
 * console.log(`Moderator has ${perms.length} permissions`);
 * ```
 */
export function getRolePermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get the highest priority role from a list of roles
 *
 * Role priority: admin > moderator > user
 *
 * @param roles - Array of role names
 * @returns The highest priority role, or null if no valid roles
 *
 * @example
 * ```typescript
 * const roles = ['user', 'moderator'];
 * const highest = getHighestRole(roles); // Returns 'moderator'
 * ```
 */
export function getHighestRole(roles: string[]): string | null {
  if (roles.includes(ROLES.ADMIN)) {
    return ROLES.ADMIN;
  }

  if (roles.includes(ROLES.MODERATOR)) {
    return ROLES.MODERATOR;
  }

  if (roles.includes(ROLES.USER)) {
    return ROLES.USER;
  }

  return null;
}

/**
 * Check if a role is valid
 *
 * @param role - The role to validate
 * @returns True if the role is recognized
 *
 * @example
 * ```typescript
 * if (isValidRole('admin')) {
 *   // Role is valid
 * }
 * ```
 */
export function isValidRole(role: string): role is Role {
  return Object.values(ROLES).includes(role as Role);
}
