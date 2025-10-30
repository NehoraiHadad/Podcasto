import 'server-only';

/**
 * Role guard utilities enforce server-side authorization invariants for
 * privileged server actions. Each guard asserts authentication and the
 * appropriate role- or permission-based requirement before allowing the
 * calling action to continue.
 */
import { SessionService } from '../session';
import { ROLES, type Permission } from '../permissions';
import {
  UnauthorizedError,
  InsufficientPermissionsError,
} from '../errors/classes';
import { isAdmin, hasRole, hasPermission } from './queries';
import type { User } from '../types';

export async function requireAuth(): Promise<User> {
  const user = await SessionService.getUser();

  if (!user) {
    throw new UnauthorizedError({
      action: 'requireAuth',
      timestamp: Date.now(),
    });
  }

  return user;
}

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
