import 'server-only';

import { db } from './index';
import { SQL, eq, sql, Table, Column } from 'drizzle-orm';

/**
 * Generic function to find a record by ID
 * @param table The table to query
 * @param idColumn The ID column of the table
 * @param id The ID value to search for
 * @returns The found record or null
 */
export async function findById<T extends { id: string | number }>(
  table: Table,
  idColumn: Column,
  id: string | number
): Promise<T | null> {
  const result = await db.select().from(table).where(eq(idColumn, id)).limit(1);
  return result.length > 0 ? (result[0] as T) : null;
}

/**
 * Generic function to find records by a condition
 * @param table The table to query
 * @param condition The SQL condition to filter by
 * @returns Array of found records
 */
export async function findBy<T>(
  table: Table,
  condition: SQL
): Promise<T[]> {
  return await db.select().from(table).where(condition) as T[];
}

/**
 * Generic function to create a new record
 * @param table The table to insert into
 * @param data The data to insert
 * @returns The created record
 */
export async function create<T, U extends Record<string, unknown>>(
  table: Table,
  data: U
): Promise<T> {
  const result = await db.insert(table).values(data).returning();
  return result[0] as T;
}

/**
 * Generic function to update a record by ID
 * @param table The table to update
 * @param idColumn The ID column of the table
 * @param id The ID value to update
 * @param data The data to update
 * @returns The updated record
 */
export async function updateById<T, U>(
  table: Table,
  idColumn: Column,
  id: string | number,
  data: Partial<U>
): Promise<T | null> {
  const result = await db.update(table)
    .set(data)
    .where(eq(idColumn, id))
    .returning();
  return result.length > 0 ? (result[0] as T) : null;
}

/**
 * Generic function to delete a record by ID
 * @param table The table to delete from
 * @param idColumn The ID column of the table
 * @param id The ID value to delete
 * @returns Boolean indicating success
 */
export async function deleteById(
  table: Table,
  idColumn: Column,
  id: string | number
): Promise<boolean> {
  const result = await db.delete(table).where(eq(idColumn, id)).returning();
  return result.length > 0;
}

/**
 * Generic function to get all records from a table
 * @param table The table to query
 * @returns Array of all records
 */
export async function getAll<T>(table: Table): Promise<T[]> {
  return await db.select().from(table) as T[];
}

/**
 * Generic function to get paginated records from a table
 * @param table The table to query
 * @param page The page number (1-based)
 * @param pageSize The number of records per page
 * @returns Array of paginated records
 */
export async function getPaginated<T>(
  table: Table,
  page: number = 1,
  pageSize: number = 10
): Promise<T[]> {
  const offset = (page - 1) * pageSize;
  return await db.select()
    .from(table)
    .limit(pageSize)
    .offset(offset) as T[];
}

/**
 * Generic function to count records in a table
 * @param table The table to count
 * @param condition Optional SQL condition to filter by
 * @returns The count of records
 */
export async function count(
  table: Table,
  condition?: SQL
): Promise<number> {
  let query = sql`SELECT COUNT(*) as count FROM ${table}`;
  if (condition) {
    query = sql`${query} WHERE ${condition}`;
  }
  const result = await db.execute(query);
  return Number(result[0].count);
}

/**
 * Generic function to check if a record exists
 * @param table The table to query
 * @param condition The SQL condition to filter by
 * @returns Boolean indicating if the record exists
 */
export async function exists(
  table: Table,
  condition: SQL
): Promise<boolean> {
  const count = await db.select({ count: sql`COUNT(*)` })
    .from(table)
    .where(condition)
    .limit(1);
  return Number(count[0].count) > 0;
} 