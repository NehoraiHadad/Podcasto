'use server';

import { calculateEpisodeCost } from '@/lib/services/cost-calculator';
import type { CostBreakdown, UsageMetrics } from '@/lib/services/cost-calculator-types';
import {
  InsufficientPermissionsError,
  UnauthorizedError,
} from '@/lib/auth';
import { requireAdmin } from '@/lib/auth/server';

export interface RecalculateEpisodeCostResult {
  success: boolean;
  breakdown?: CostBreakdown;
  metrics?: UsageMetrics;
  error?: string;
}

/**
 * Manually recalculate episode cost
 * Admin-only action - requires admin role
 * Useful for:
 * - Fixing incorrect cost calculations
 * - Recalculating after pricing changes
 * - Debugging cost tracking issues
 */
export async function recalculateEpisodeCost({
  episodeId,
}: {
  episodeId: string;
}): Promise<RecalculateEpisodeCostResult> {
  try {
    // Check admin role
    await requireAdmin();

    // Recalculate cost
    const result = await calculateEpisodeCost({ episodeId });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to calculate episode cost',
      };
    }

    return {
      success: true,
      breakdown: result.breakdown,
      metrics: result.metrics,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    if (error instanceof InsufficientPermissionsError) {
      return {
        success: false,
        error: 'Admin access required',
      };
    }

    console.error('[RECALCULATE_COST] Error recalculating episode cost:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to recalculate episode cost',
    };
  }
}
