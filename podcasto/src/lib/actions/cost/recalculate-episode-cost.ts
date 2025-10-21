'use server';

import { calculateEpisodeCost } from '@/lib/services/cost-calculator';
import type { CostBreakdown, UsageMetrics } from '@/lib/services/cost-calculator-types';
import { createClient } from '@/lib/supabase/server';

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return {
        success: false,
        error: 'Admin access required',
      };
    }

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
