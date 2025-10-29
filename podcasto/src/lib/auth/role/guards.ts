'use server';

/**
 * Role Guards
 *
 * Guard functions that throw errors on authorization failure.
 * Use these at the start of protected server actions to enforce access control.
 */
import { SessionService } from '../session';
import { SessionService } from '../session';
  const user = await SessionService.getUser();
import {
  UnauthorizedError,
  InsufficientPermissionsError,
} from '../errors/classes';
import { ROLES, type Permission } from '../permissions';
import { isAdmin, hasRole, hasPermission } from './queries';
import type { User } from '../types';

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
}
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
