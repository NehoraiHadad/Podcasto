'use server';

import { revalidatePath } from 'next/cache';
import { checkIsAdmin } from '../admin/auth-actions';
import type { ActionResult } from '../shared/types';
import { errorResult } from '../shared/error-handler';
import {
  getActiveCreditPackages,
  getAllCreditPackages,
  createCreditPackage,
  updateCreditPackage,
  deleteCreditPackage,
  toggleCreditPackageStatus,
  type CreditPackageRecord,
  type CreateCreditPackageData,
  type UpdateCreditPackageData
} from '@/lib/db/api/credits';

/**
 * Credit Package Admin Actions
 * Server actions for managing credit packages (admin only)
 */

/**
 * Get all active credit packages (public)
 */
export async function getActiveCreditPackagesAction(): Promise<
  ActionResult<CreditPackageRecord[]>
> {
  try {
    const packages = await getActiveCreditPackages();

    return {
      success: true,
      data: packages
    };
  } catch (error) {
    console.error('[getActiveCreditPackagesAction] Error:', error);
    return errorResult(error instanceof Error ? error.message : 'Failed to get credit packages');
  }
}

/**
 * Get all credit packages including inactive (admin only)
 */
export async function getAllCreditPackagesAction(): Promise<
  ActionResult<CreditPackageRecord[]>
> {
  try {
    await checkIsAdmin({ redirectOnFailure: true });

    const packages = await getAllCreditPackages();

    return {
      success: true,
      data: packages
    };
  } catch (error) {
    console.error('[getAllCreditPackagesAction] Error:', error);
    return errorResult(error instanceof Error ? error.message : 'Failed to get all credit packages');
  }
}

/**
 * Create a new credit package (admin only)
 */
export async function createCreditPackageAction(
  data: CreateCreditPackageData
): Promise<ActionResult<CreditPackageRecord>> {
  try {
    await checkIsAdmin({ redirectOnFailure: true });

    const pkg = await createCreditPackage(data);

    revalidatePath('/admin/credits');
    revalidatePath('/credits');

    return {
      success: true,
      data: pkg
    };
  } catch (error) {
    console.error('[createCreditPackageAction] Error:', error);
    return errorResult(error instanceof Error ? error.message : 'Failed to create credit package');
  }
}

/**
 * Update a credit package (admin only)
 */
export async function updateCreditPackageAction(
  packageId: string,
  data: UpdateCreditPackageData
): Promise<ActionResult<CreditPackageRecord>> {
  try {
    await checkIsAdmin({ redirectOnFailure: true });

    const pkg = await updateCreditPackage(packageId, data);

    if (!pkg) {
      return {
        success: false,
        error: 'Credit package not found'
      };
    }

    revalidatePath('/admin/credits');
    revalidatePath('/credits');

    return {
      success: true,
      data: pkg
    };
  } catch (error) {
    console.error('[updateCreditPackageAction] Error:', error);
    return errorResult(error instanceof Error ? error.message : 'Failed to update credit package');
  }
}

/**
 * Delete a credit package (admin only)
 */
export async function deleteCreditPackageAction(
  packageId: string
): Promise<ActionResult<void>> {
  try {
    await checkIsAdmin({ redirectOnFailure: true });

    const success = await deleteCreditPackage(packageId);

    if (!success) {
      return {
        success: false,
        error: 'Credit package not found'
      };
    }

    revalidatePath('/admin/credits');
    revalidatePath('/credits');

    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    console.error('[deleteCreditPackageAction] Error:', error);
    return errorResult(error instanceof Error ? error.message : 'Failed to delete credit package');
  }
}

/**
 * Toggle credit package active status (admin only)
 */
export async function toggleCreditPackageStatusAction(
  packageId: string
): Promise<ActionResult<CreditPackageRecord>> {
  try {
    await checkIsAdmin({ redirectOnFailure: true });

    const pkg = await toggleCreditPackageStatus(packageId);

    if (!pkg) {
      return {
        success: false,
        error: 'Credit package not found'
      };
    }

    revalidatePath('/admin/credits');
    revalidatePath('/credits');

    return {
      success: true,
      data: pkg
    };
  } catch (error) {
    console.error('[toggleCreditPackageStatusAction] Error:', error);
    return errorResult(error instanceof Error ? error.message : 'Failed to toggle package status');
  }
}
