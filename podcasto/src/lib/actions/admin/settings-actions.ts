'use server';

import { checkIsAdmin } from './auth-actions';
import {
  getAllSystemSettings,
  updateSystemSetting,
  initializeSystemSettings,
} from '@/lib/db/api/system-settings';
import { SYSTEM_SETTING_KEYS } from '@/lib/db/schema/system-settings';
import { SessionService } from '@/lib/auth/server';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/utils/error-utils';

/**
 * Supported types for system setting values
 */
export type SystemSettingValue =
  | string
  | number
  | boolean
  | Record<string, unknown>;

/**
 * Get all system settings (admin only)
 */
export async function getSystemSettingsAction() {
  const isAdmin = await checkIsAdmin({ redirectOnFailure: false });

  if (!isAdmin) {
    return {
      success: false as const,
      error: 'Unauthorized: Admin access required',
    };
  }

  try {
    const settings = await getAllSystemSettings();
    return createSuccessResponse({ settings });
  } catch (error) {
    return createErrorResponse(
      error,
      'Failed to fetch settings',
      'GET_SYSTEM_SETTINGS'
    );
  }
}

/**
 * Update a system setting (admin only)
 */
export async function updateSystemSettingAction(
  key: string,
  value: SystemSettingValue
) {
  const isAdmin = await checkIsAdmin({ redirectOnFailure: false });

  if (!isAdmin) {
    return {
      success: false as const,
      error: 'Unauthorized: Admin access required',
    };
  }

  try {
    const user = await SessionService.getUser();
    await updateSystemSetting(key, value, user?.id);

    return createSuccessResponse({
      message: 'Setting updated successfully',
    });
  } catch (error) {
    return createErrorResponse(
      error,
      'Failed to update setting',
      'UPDATE_SYSTEM_SETTING'
    );
  }
}

/**
 * Initialize system settings with defaults (admin only)
 * Safe to run multiple times - won't overwrite existing settings
 */
export async function initializeSystemSettingsAction() {
  const isAdmin = await checkIsAdmin({ redirectOnFailure: false });

  if (!isAdmin) {
    return {
      success: false as const,
      error: 'Unauthorized: Admin access required',
    };
  }

  try {
    await initializeSystemSettings();

    return createSuccessResponse({
      message: 'System settings initialized successfully',
    });
  } catch (error) {
    return createErrorResponse(
      error,
      'Failed to initialize settings',
      'INITIALIZE_SYSTEM_SETTINGS'
    );
  }
}

/**
 * Get specific setting keys
 */
export const SETTING_KEYS = SYSTEM_SETTING_KEYS;
