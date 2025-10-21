import { db } from '@/lib/db';
import { systemSettings, SYSTEM_SETTING_KEYS, DEFAULT_SYSTEM_SETTINGS } from '@/lib/db/schema/system-settings';
import { eq } from 'drizzle-orm';

/**
 * Get a system setting by key
 * Returns default value if setting doesn't exist
 */
export async function getSystemSetting<T = string>(
  key: string,
  defaultValue?: T
): Promise<T> {
  const setting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, key)
  });

  if (!setting) {
    // Return provided default or system default
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    // Get from system defaults
    const systemDefault = DEFAULT_SYSTEM_SETTINGS[key as keyof typeof DEFAULT_SYSTEM_SETTINGS];
    if (systemDefault) {
      return parseSettingValue(systemDefault.value, systemDefault.value_type) as T;
    }

    throw new Error(`System setting '${key}' not found and no default provided`);
  }

  return parseSettingValue(setting.value, setting.value_type) as T;
}

/**
 * Get multiple system settings by keys
 */
export async function getSystemSettings(keys: string[]): Promise<Record<string, any>> {
  const settings = await db.query.systemSettings.findMany({
    where: (systemSettings, { inArray }) => inArray(systemSettings.key, keys)
  });

  const result: Record<string, any> = {};

  for (const key of keys) {
    const setting = settings.find(s => s.key === key);
    if (setting) {
      result[key] = parseSettingValue(setting.value, setting.value_type);
    } else {
      // Use default value
      const systemDefault = DEFAULT_SYSTEM_SETTINGS[key as keyof typeof DEFAULT_SYSTEM_SETTINGS];
      if (systemDefault) {
        result[key] = parseSettingValue(systemDefault.value, systemDefault.value_type);
      }
    }
  }

  return result;
}

/**
 * Get all system settings grouped by category
 */
export async function getAllSystemSettings(): Promise<Record<string, any>> {
  const settings = await db.select().from(systemSettings);

  const result: Record<string, any> = {};

  // Add all existing settings
  for (const setting of settings) {
    result[setting.key] = {
      value: parseSettingValue(setting.value, setting.value_type),
      description: setting.description,
      category: setting.category,
      updated_at: setting.updated_at,
      updated_by: setting.updated_by
    };
  }

  // Add missing defaults
  for (const [key, defaultSetting] of Object.entries(DEFAULT_SYSTEM_SETTINGS)) {
    if (!result[key]) {
      result[key] = {
        value: parseSettingValue(defaultSetting.value, defaultSetting.value_type),
        description: defaultSetting.description,
        category: defaultSetting.category,
        updated_at: null,
        updated_by: null
      };
    }
  }

  return result;
}

/**
 * Get premium credit threshold (cached in memory for performance)
 */
let cachedPremiumThreshold: number | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

export async function getPremiumCreditThreshold(): Promise<number> {
  const now = Date.now();

  // Return cached value if still valid
  if (cachedPremiumThreshold !== null && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedPremiumThreshold;
  }

  // Fetch from database
  const threshold = await getSystemSetting<number>(
    SYSTEM_SETTING_KEYS.PREMIUM_CREDIT_THRESHOLD,
    100 // Fallback default
  );

  // Update cache
  cachedPremiumThreshold = threshold;
  cacheTimestamp = now;

  return threshold;
}

/**
 * Parse setting value based on type
 */
function parseSettingValue(value: string, valueType: string): any {
  switch (valueType) {
    case 'number':
      return Number(value);
    case 'boolean':
      return value === 'true';
    case 'json':
      return JSON.parse(value);
    case 'string':
    default:
      return value;
  }
}

/**
 * Format value for storage
 */
function formatSettingValue(value: any, valueType: string): string {
  switch (valueType) {
    case 'number':
    case 'boolean':
      return String(value);
    case 'json':
      return JSON.stringify(value);
    case 'string':
    default:
      return value;
  }
}

/**
 * Update a system setting
 */
export async function updateSystemSetting(
  key: string,
  value: any,
  updatedBy?: string
): Promise<void> {
  // Get value type from defaults or existing setting
  let valueType = 'string';
  const systemDefault = DEFAULT_SYSTEM_SETTINGS[key as keyof typeof DEFAULT_SYSTEM_SETTINGS];
  if (systemDefault) {
    valueType = systemDefault.value_type;
  }

  const formattedValue = formatSettingValue(value, valueType);

  await db
    .insert(systemSettings)
    .values({
      key,
      value: formattedValue,
      value_type: valueType,
      description: systemDefault?.description,
      category: systemDefault?.category,
      updated_by: updatedBy,
      updated_at: new Date()
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: formattedValue,
        updated_by: updatedBy,
        updated_at: new Date()
      }
    });

  // Clear cache for premium threshold
  if (key === SYSTEM_SETTING_KEYS.PREMIUM_CREDIT_THRESHOLD) {
    cachedPremiumThreshold = null;
  }
}

/**
 * Initialize system settings with defaults
 * Should be run once during setup
 */
export async function initializeSystemSettings(): Promise<void> {
  const settingsToInsert = Object.entries(DEFAULT_SYSTEM_SETTINGS).map(([key, setting]) => ({
    key,
    value: setting.value,
    value_type: setting.value_type,
    description: setting.description,
    category: setting.category,
    updated_at: new Date()
  }));

  for (const setting of settingsToInsert) {
    await db
      .insert(systemSettings)
      .values(setting)
      .onConflictDoNothing(); // Don't overwrite existing settings
  }
}
