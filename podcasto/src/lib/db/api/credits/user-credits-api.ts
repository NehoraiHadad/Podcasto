import { nowUTC } from '@/lib/utils/date/server';
import { db } from '@/lib/db';
import { userCredits, creditTransactions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * User Credits API
 * Handles all database operations related to user credits
 */

export interface UserCreditsRecord {
  id: string;
  user_id: string;
  total_credits: string;
  used_credits: string;
  available_credits: string;
  free_credits: string;
  last_purchase_at: Date | null;
  credits_expire_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserCreditsData {
  user_id: string;
  total_credits?: string;
  free_credits?: string;
}

/**
 * Get user credits by user ID
 */
export async function getUserCredits(
  userId: string
): Promise<UserCreditsRecord | null> {
  const [credits] = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.user_id, userId))
    .limit(1);

  return credits || null;
}

/**
 * Create initial credits record for a new user
 */
export async function createUserCredits(
  data: CreateUserCreditsData
): Promise<UserCreditsRecord> {
  const totalCredits = data.total_credits || '0';
  const freeCredits = data.free_credits || '0';
  const availableCredits = totalCredits;

  const [credits] = await db
    .insert(userCredits)
    .values({
      user_id: data.user_id,
      total_credits: totalCredits,
      used_credits: '0',
      available_credits: availableCredits,
      free_credits: freeCredits,
      updated_at: nowUTC()
    })
    .returning();

  return credits;
}

/**
 * Add credits to user account
 * This updates total_credits and available_credits
 */
export async function addCreditsToUser(
  userId: string,
  amount: string,
  isFreeCredits: boolean = false
): Promise<UserCreditsRecord> {
  const [updated] = await db
    .update(userCredits)
    .set({
      total_credits: sql`${userCredits.total_credits} + ${amount}`,
      available_credits: sql`${userCredits.available_credits} + ${amount}`,
      ...(isFreeCredits && {
        free_credits: sql`${userCredits.free_credits} + ${amount}`
      }),
      ...(!isFreeCredits && {
        last_purchase_at: nowUTC()
      }),
      updated_at: nowUTC()
    })
    .where(eq(userCredits.user_id, userId))
    .returning();

  return updated;
}

/**
 * Deduct credits from user account
 * This updates used_credits and available_credits
 */
export async function deductCreditsFromUser(
  userId: string,
  amount: string
): Promise<UserCreditsRecord> {
  const [updated] = await db
    .update(userCredits)
    .set({
      used_credits: sql`${userCredits.used_credits} + ${amount}`,
      available_credits: sql`${userCredits.available_credits} - ${amount}`,
      updated_at: nowUTC()
    })
    .where(eq(userCredits.user_id, userId))
    .returning();

  return updated;
}

/**
 * Check if user has enough credits
 */
export async function hasEnoughCredits(
  userId: string,
  required: number
): Promise<boolean> {
  const credits = await getUserCredits(userId);
  if (!credits) return false;

  const available = parseFloat(credits.available_credits);
  return available >= required;
}

/**
 * Get or create user credits
 * Returns existing credits or creates new record with free credits
 */
export async function getOrCreateUserCredits(
  userId: string,
  initialFreeCredits: string = '0'
): Promise<UserCreditsRecord> {
  const existing = await getUserCredits(userId);

  if (existing) {
    return existing;
  }

  return createUserCredits({
    user_id: userId,
    total_credits: initialFreeCredits,
    free_credits: initialFreeCredits
  });
}

/**
 * Refund credits to user account
 * This reverses a previous credit deduction by updating used_credits and available_credits
 * Used for rollback scenarios when episode generation fails after credit deduction
 */
export async function refundCreditsToUser(
  userId: string,
  amount: string
): Promise<UserCreditsRecord> {
  const [updated] = await db
    .update(userCredits)
    .set({
      used_credits: sql`${userCredits.used_credits} - ${amount}`,
      available_credits: sql`${userCredits.available_credits} + ${amount}`,
      updated_at: nowUTC()
    })
    .where(eq(userCredits.user_id, userId))
    .returning();

  return updated;
}
