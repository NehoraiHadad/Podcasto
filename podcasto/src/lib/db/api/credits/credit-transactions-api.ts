import { db } from '@/lib/db';
import { creditTransactions } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

/**
 * Credit Transactions API
 * Handles all database operations related to credit transaction history
 */

export type TransactionType = 'purchase' | 'usage' | 'bonus' | 'refund' | 'subscription';

export interface CreditTransactionRecord {
  id: string;
  user_id: string;
  amount: string;
  transaction_type: string;
  balance_after: string;
  episode_id: string | null;
  podcast_id: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

export interface CreateTransactionData {
  user_id: string;
  amount: string;
  transaction_type: TransactionType;
  balance_after: string;
  episode_id?: string;
  podcast_id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a new credit transaction record
 */
export async function createCreditTransaction(
  data: CreateTransactionData
): Promise<CreditTransactionRecord> {
  const [transaction] = await db
    .insert(creditTransactions)
    .values({
      user_id: data.user_id,
      amount: data.amount,
      transaction_type: data.transaction_type,
      balance_after: data.balance_after,
      episode_id: data.episode_id || null,
      podcast_id: data.podcast_id || null,
      description: data.description || null,
      metadata: data.metadata || null
    })
    .returning();

  return transaction;
}

/**
 * Get transaction history for a user
 */
export async function getUserTransactionHistory(
  userId: string,
  limit: number = 50
): Promise<CreditTransactionRecord[]> {
  const transactions = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.user_id, userId))
    .orderBy(desc(creditTransactions.created_at))
    .limit(limit);

  return transactions;
}

/**
 * Get transactions by type for a user
 */
export async function getUserTransactionsByType(
  userId: string,
  type: TransactionType,
  limit: number = 50
): Promise<CreditTransactionRecord[]> {
  const transactions = await db
    .select()
    .from(creditTransactions)
    .where(and(
      eq(creditTransactions.user_id, userId),
      eq(creditTransactions.transaction_type, type)
    ))
    .orderBy(desc(creditTransactions.created_at))
    .limit(limit);

  return transactions;
}

/**
 * Get transaction for a specific episode
 */
export async function getEpisodeTransaction(
  episodeId: string
): Promise<CreditTransactionRecord | null> {
  const [transaction] = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.episode_id, episodeId))
    .limit(1);

  return transaction || null;
}
