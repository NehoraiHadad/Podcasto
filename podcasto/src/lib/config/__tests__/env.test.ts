import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearSupabaseEnvCache, getSupabaseEnv } from '../env';

const originalEnv = { ...process.env };

function resetEnv() {
  Object.keys(process.env).forEach((key) => {
    delete process.env[key];
  });
  Object.assign(process.env, originalEnv);
}

describe('getSupabaseEnv', () => {
  beforeEach(() => {
    resetEnv();
    clearSupabaseEnvCache();
  });

  afterEach(() => {
    resetEnv();
    clearSupabaseEnvCache();
  });

  it('throws a descriptive error when required variables are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

    expect(() => getSupabaseEnv()).toThrowError(
      /NEXT_PUBLIC_SUPABASE_URL is required/i
    );
  });
});
