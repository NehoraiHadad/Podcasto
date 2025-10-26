'use server';

/**
 * Role Management
 *
 * Functions for adding and removing user roles.
 * These operations require admin privileges.
 */import { userRolesApi } from '@/lib/db/api';
import { AUTH_ERROR_CODES, AuthenticationError } from '../errors/classes';
import type { AuthResult } from '../types';
import type { UserRole } from '@/lib/db/api/user-roles';
import { requireAdmin } from './guards';
import { getUserRoles } from './queries';

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

    console.error('[RoleManagement] Error adding user role:', error);
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

    console.error('[RoleManagement] Error removing user role:', error);
    return {
      success: false,
      error: {
        message: 'Failed to remove user role',
        code: AUTH_ERROR_CODES.INTERNAL_ERROR,
      },
    };
  }
}
