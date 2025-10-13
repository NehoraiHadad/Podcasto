import { userRoles } from '../schema';
import { eq, sql } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as dbUtils from '../utils';

// ============================================================================
// Types
// ============================================================================

/**
 * User role model - represents a user_roles record from the database
 */
export type UserRole = InferSelectModel<typeof userRoles>;

/**
 * New user role data for insertion
 */
export type NewUserRole = InferInsertModel<typeof userRoles>;

// ============================================================================
// Read Operations (Queries)
// ============================================================================

/**
 * Get all user roles
 *
 * @returns Array of all user roles
 *
 * @example
 * ```typescript
 * const allRoles = await getAllUserRoles();
 * console.log(`Total roles: ${allRoles.length}`);
 * ```
 */
export async function getAllUserRoles(): Promise<UserRole[]> {
  return await dbUtils.getAll<UserRole>(userRoles);
}

/**
 * Get user role by ID
 *
 * @param id - User role ID (UUID)
 * @returns The user role if found, null otherwise
 *
 * @example
 * ```typescript
 * const role = await getUserRoleById('role-123');
 * if (role) {
 *   console.log(role.role);
 * }
 * ```
 */
export async function getUserRoleById(id: string): Promise<UserRole | null> {
  return await dbUtils.findById<UserRole>(userRoles, userRoles.id, id);
}

/**
 * Get all roles for a specific user
 *
 * @param userId - User ID
 * @returns Array of roles for the user
 *
 * @example
 * ```typescript
 * const roles = await getUserRoles('user-123');
 * console.log(`User has ${roles.length} roles`);
 * ```
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  return await dbUtils.findBy<UserRole>(userRoles, eq(userRoles.user_id, userId));
}

/**
 * Get total count of user roles
 *
 * @returns The total number of user roles
 *
 * @example
 * ```typescript
 * const total = await getUserRoleCount();
 * console.log(`Total roles: ${total}`);
 * ```
 */
export async function getUserRoleCount(): Promise<number> {
  return await dbUtils.count(userRoles);
}

/**
 * Check if a user has a specific role
 *
 * @param userId - User ID
 * @param role - Role name (e.g., 'admin', 'user')
 * @returns true if user has the role, false otherwise
 *
 * @example
 * ```typescript
 * const hasAdmin = await hasUserRole('user-123', 'admin');
 * if (hasAdmin) {
 *   console.log('User is an admin');
 * }
 * ```
 */
export async function hasUserRole(userId: string, role: string): Promise<boolean> {
  return await dbUtils.exists(
    userRoles,
    sql`${userRoles.user_id} = ${userId} AND ${userRoles.role} = ${role}`
  );
}

/**
 * Check if a user is an admin
 *
 * @param userId - User ID
 * @returns true if user has admin role, false otherwise
 *
 * @example
 * ```typescript
 * const isAdmin = await isUserAdmin('user-123');
 * if (isAdmin) {
 *   // Allow access to admin dashboard
 * }
 * ```
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  return await hasUserRole(userId, 'admin');
}

// ============================================================================
// Write Operations (Mutations)
// ============================================================================

/**
 * Create a new user role
 *
 * @param data - User role data to insert
 * @returns The created user role
 *
 * @example
 * ```typescript
 * const role = await createUserRole({
 *   user_id: 'user-123',
 *   role: 'admin'
 * });
 * ```
 */
export async function createUserRole(data: NewUserRole): Promise<UserRole> {
  return await dbUtils.create<UserRole, NewUserRole>(userRoles, data);
}

/**
 * Delete a user role
 *
 * @param id - User role ID
 * @returns true if role was deleted, false if not found
 *
 * @example
 * ```typescript
 * const success = await deleteUserRole('role-123');
 * ```
 */
export async function deleteUserRole(id: string): Promise<boolean> {
  return await dbUtils.deleteById(userRoles, userRoles.id, id);
}
