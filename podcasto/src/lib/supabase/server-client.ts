import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SerializeOptions } from 'cookie';
import { getSupabaseEnv } from '@/lib/config/env';
import type { Database } from './types';

export type SupabaseCookieOptions = Partial<SerializeOptions> & {
  priority?: 'low' | 'medium' | 'high';
};

type CookieValue = { value: string } | string | undefined;

export type SupabaseCookieStore = {
  get: (name: string) => CookieValue;
  set?:
    | ((name: string, value: string, options?: SupabaseCookieOptions) => unknown)
    | ((options: { name: string; value: string } & SupabaseCookieOptions) => unknown);
  delete?:
    | ((name: string, options?: SupabaseCookieOptions) => unknown)
    | ((options: { name: string } & SupabaseCookieOptions) => unknown);
  remove?:
    | ((name: string, options?: SupabaseCookieOptions) => unknown)
    | ((options: { name: string } & SupabaseCookieOptions) => unknown);
};

function extractCookieValue(value: CookieValue) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.value;
}

function applySet(
  cookiesStore: SupabaseCookieStore,
  name: string,
  value: string,
  options?: SupabaseCookieOptions
) {
  if (!cookiesStore.set) return;

  const setter = cookiesStore.set as
    | ((name: string, value: string, options?: SupabaseCookieOptions) => unknown)
    | ((options: { name: string; value: string } & SupabaseCookieOptions) => unknown);

  try {
    (setter as (name: string, value: string, options?: SupabaseCookieOptions) => unknown)(
      name,
      value,
      options
    );
  } catch {
    try {
      (setter as (options: { name: string; value: string } & SupabaseCookieOptions) => unknown)({
        name,
        value,
        ...options,
      });
    } catch {
      // Ignore if we cannot set cookies in this context (e.g., server components)
    }
  }
}

function applyDelete(
  cookiesStore: SupabaseCookieStore,
  name: string,
  options?: SupabaseCookieOptions
) {
  const remover = cookiesStore.remove ?? cookiesStore.delete;
  if (!remover) return;

  const deleteFn = remover as
    | ((name: string, options?: SupabaseCookieOptions) => unknown)
    | ((options: { name: string } & SupabaseCookieOptions) => unknown);

  try {
    (deleteFn as (name: string, options?: SupabaseCookieOptions) => unknown)(
      name,
      options
    );
  } catch {
    try {
      (deleteFn as (options: { name: string } & SupabaseCookieOptions) => unknown)({
        name,
        ...options,
      });
    } catch {
      // Ignore delete failures (e.g., read-only cookies store)
    }
  }
}

export function createSupabaseServerClient(
  cookiesStore: SupabaseCookieStore
): SupabaseClient<Database> {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getSupabaseEnv();

  return createServerClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return extractCookieValue(cookiesStore.get(name));
        },
        set(name, value, options) {
          applySet(cookiesStore, name, value, options);
        },
        remove(name, options) {
          applyDelete(cookiesStore, name, options);
        },
      },
    }
  );
}
