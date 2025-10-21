import { db } from '@/lib/db';
import { creditPackages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Credit Packages API
 * Handles database operations for credit package management
 */

export interface CreditPackageRecord {
  id: string;
  name: string;
  credits_amount: string;
  price_usd: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  validity_days: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCreditPackageData {
  name: string;
  credits_amount: string;
  price_usd: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
  validity_days?: number;
}

export interface UpdateCreditPackageData {
  name?: string;
  credits_amount?: string;
  price_usd?: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
  validity_days?: number;
}

/**
 * Get all active credit packages
 */
export async function getActiveCreditPackages(): Promise<CreditPackageRecord[]> {
  const packages = await db
    .select()
    .from(creditPackages)
    .where(eq(creditPackages.is_active, true))
    .orderBy(creditPackages.display_order);

  return packages;
}

/**
 * Get all credit packages (including inactive) - Admin only
 */
export async function getAllCreditPackages(): Promise<CreditPackageRecord[]> {
  const packages = await db
    .select()
    .from(creditPackages)
    .orderBy(creditPackages.display_order);

  return packages;
}

/**
 * Get credit package by ID
 */
export async function getCreditPackageById(
  packageId: string
): Promise<CreditPackageRecord | null> {
  const [pkg] = await db
    .select()
    .from(creditPackages)
    .where(eq(creditPackages.id, packageId))
    .limit(1);

  return pkg || null;
}

/**
 * Create a new credit package
 */
export async function createCreditPackage(
  data: CreateCreditPackageData
): Promise<CreditPackageRecord> {
  const [pkg] = await db
    .insert(creditPackages)
    .values({
      name: data.name,
      credits_amount: data.credits_amount,
      price_usd: data.price_usd,
      description: data.description || null,
      is_active: data.is_active ?? true,
      display_order: data.display_order ?? 0,
      validity_days: data.validity_days || null,
      updated_at: new Date()
    })
    .returning();

  return pkg;
}

/**
 * Update a credit package
 */
export async function updateCreditPackage(
  packageId: string,
  data: UpdateCreditPackageData
): Promise<CreditPackageRecord | null> {
  const [pkg] = await db
    .update(creditPackages)
    .set({
      ...data,
      updated_at: new Date()
    })
    .where(eq(creditPackages.id, packageId))
    .returning();

  return pkg || null;
}

/**
 * Delete a credit package
 */
export async function deleteCreditPackage(packageId: string): Promise<boolean> {
  const result = await db
    .delete(creditPackages)
    .where(eq(creditPackages.id, packageId));

  return Array.isArray(result) ? result.length > 0 : true;
}

/**
 * Toggle package active status
 */
export async function toggleCreditPackageStatus(
  packageId: string
): Promise<CreditPackageRecord | null> {
  // First get current status
  const pkg = await getCreditPackageById(packageId);
  if (!pkg) return null;

  // Toggle the status
  return updateCreditPackage(packageId, {
    is_active: !pkg.is_active
  });
}
