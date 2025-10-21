'use server';

import { checkIsAdmin } from './auth-actions';
import {
  getAllSystemSettings,
  updateSystemSetting,
  initializeSystemSettings
} from '@/lib/db/api/system-settings';
import { SYSTEM_SETTING_KEYS } from '@/lib/db/schema/system-settings';
import { getUser } from '@/lib/auth';

/**
 * Get all system settings (admin only)
 */
export async function getSystemSettingsAction() {
  const isAdmin = await checkIsAdmin({ redirectOnFailure: false });

  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Admin access required'
    };
  }

  try {
    const settings = await getAllSystemSettings();

    return {
      success: true,
      data: settings
    };
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch settings'
    };
  }
}

/**
 * Update a system setting (admin only)
 */
export async function updateSystemSettingAction(key: string, value: any) {
  const isAdmin = await checkIsAdmin({ redirectOnFailure: false });

  if (!isAdmin) {
    return {
      success: false,
      error: 'Unauthorized: Admin access required'
    };
  }

  try {
    const user = await getUser();
    await updateSystemSetting(key, value, user?.id);

    return {
      success: true,
      message: 'Setting updated successfully'
    };
  } catch (error) {
    console.error('Error updating system setting:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update setting'
    };
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
      success: false,
      error: 'Unauthorized: Admin access required'
    };
  }

  try {
    await initializeSystemSettings();

    return {
      success: true,
      message: 'System settings initialized successfully'
    };
  } catch (error) {
    console.error('Error initializing system settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize settings'
    };
  }
}

/**
 * Get specific setting keys
 */
export const SETTING_KEYS = SYSTEM_SETTING_KEYS;
