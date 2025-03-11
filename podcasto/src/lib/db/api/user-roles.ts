import { userRoles } from '../schema';
import { eq, sql } from 'drizzle-orm';
import * as dbUtils from '../utils';

// Types
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;

/**
 * Returns all user roles
 */
export async function getAllUserRoles(): Promise<UserRole[]> {
  return await dbUtils.getAll<UserRole>(userRoles);
}

/**
 * Returns a user role by ID
 */
export async function getUserRoleById(id: string): Promise<UserRole | null> {
  return await dbUtils.findById<UserRole>(userRoles, userRoles.id, id);
}

/**
 * Creates a new user role
 */
export async function createUserRole(data: NewUserRole): Promise<UserRole> {
  return await dbUtils.create<UserRole, NewUserRole>(userRoles, data);
}

/**
 * Deletes a user role
 */
export async function deleteUserRole(id: string): Promise<boolean> {
  return await dbUtils.deleteById(userRoles, userRoles.id, id);
}

/**
 * Returns all roles for a specific user
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  return await dbUtils.findBy<UserRole>(userRoles, eq(userRoles.user_id, userId));
}

/**
 * Checks if a user has a specific role
 */
export async function hasUserRole(userId: string, role: string): Promise<boolean> {
  return await dbUtils.exists(
    userRoles,
    sql`${userRoles.user_id} = ${userId} AND ${userRoles.role} = ${role}`
  );
}

/**
 * Checks if a user is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  return await hasUserRole(userId, 'admin');
}

/**
 * Returns the total count of user roles
 */
export async function getUserRoleCount(): Promise<number> {
  return await dbUtils.count(userRoles);
} 