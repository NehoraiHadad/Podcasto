/**
 * Role Module
 *
 * Unified exports for role and permission management.
 * Provides clean barrel exports with backward compatibility.
 */

// Types
export type { RoleCheckResult, PermissionCheckResult } from './types';

// Queries (cached per request)
export {
  getUserRoles,
  hasRole,
  isAdmin,
  getAdminStatus,
  hasPermission,
  getUserPermissions,
} from './queries';

// Guards (throw on failure)
export {
  requireAuth,
  requireAdmin,
  requireRole,
  requirePermission,
} from './guards';

// Checks (return detailed info)
export {
  checkRole,
  checkPermission,
  getUserHighestRole,
} from './checks';

// Management (add/remove roles)
export {
  addUserRole,
  removeUserRole,
} from './management';
