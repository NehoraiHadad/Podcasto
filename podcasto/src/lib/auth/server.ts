'use server';

import { SessionService as sessionServiceImpl } from './session/session-service';
import type { SessionService as SessionServiceType } from './session/session-service';
import {
  getCachedServerClient as getCachedServerClientImpl,
  createServerClient as createServerClientImpl,
  getUser as getUserImpl,
  getSession as getSessionImpl,
  getAuthState as getAuthStateImpl,
} from './session/getters';
import {
  validateSession as validateSessionImpl,
  refreshSession as refreshSessionImpl,
  clearSession as clearSessionImpl,
} from './session/validators';
import {
  createMiddlewareClient as createMiddlewareClientImpl,
  updateSession as updateSessionImpl,
} from './session/middleware';
import {
  getUserRoles as getUserRolesImpl,
  hasRole as hasRoleImpl,
  isAdmin as isAdminImpl,
  getAdminStatus as getAdminStatusImpl,
  hasPermission as hasPermissionImpl,
  getUserPermissions as getUserPermissionsImpl,
} from './role/queries';
import {
  checkRole as checkRoleImpl,
  checkPermission as checkPermissionImpl,
  getUserHighestRole as getUserHighestRoleImpl,
} from './role/checks';
import {
  requireAuth as requireAuthImpl,
  requireAdmin as requireAdminImpl,
  requireRole as requireRoleImpl,
  requirePermission as requirePermissionImpl,
} from './role/guards';
import {
  addUserRole as addUserRoleImpl,
  removeUserRole as removeUserRoleImpl,
} from './role/management';

const wrapServerFunction = <Fn extends (...args: unknown[]) => Promise<unknown>>(
  fn: Fn
): Fn =>
  (async (
    ...args: Parameters<Fn>
  ): Promise<Awaited<ReturnType<Fn>>> => fn(...args)) as Fn;

type SessionServiceExport = (() => Promise<SessionServiceType>) &
  SessionServiceType;

export const SessionService: SessionServiceExport = Object.assign(
  async () => sessionServiceImpl,
  sessionServiceImpl
);

export const getCachedServerClient = wrapServerFunction(
  getCachedServerClientImpl
);
export const createServerClient = wrapServerFunction(createServerClientImpl);
export const getUser = wrapServerFunction(getUserImpl);
export const getSession = wrapServerFunction(getSessionImpl);
export const getAuthState = wrapServerFunction(getAuthStateImpl);

export const validateSession = wrapServerFunction(validateSessionImpl);
export const refreshSession = wrapServerFunction(refreshSessionImpl);
export const clearSession = wrapServerFunction(clearSessionImpl);

export const createMiddlewareClient = wrapServerFunction(
  createMiddlewareClientImpl
);
export const updateSession = wrapServerFunction(updateSessionImpl);

export const getUserRoles = wrapServerFunction(getUserRolesImpl);
export const hasRole = wrapServerFunction(hasRoleImpl);
export const isAdmin = wrapServerFunction(isAdminImpl);
export const getAdminStatus = wrapServerFunction(getAdminStatusImpl);
export const hasPermission = wrapServerFunction(hasPermissionImpl);
export const getUserPermissions = wrapServerFunction(
  getUserPermissionsImpl
);

export const checkRole = wrapServerFunction(checkRoleImpl);
export const checkPermission = wrapServerFunction(checkPermissionImpl);
export const getUserHighestRole = wrapServerFunction(getUserHighestRoleImpl);

export const requireAuth = wrapServerFunction(requireAuthImpl);
export const requireAdmin = wrapServerFunction(requireAdminImpl);
export const requireRole = wrapServerFunction(requireRoleImpl);
export const requirePermission = wrapServerFunction(requirePermissionImpl);

export const addUserRole = wrapServerFunction(addUserRoleImpl);
export const removeUserRole = wrapServerFunction(removeUserRoleImpl);

export { type SessionService as SessionServiceDefinition } from './session/session-service';
