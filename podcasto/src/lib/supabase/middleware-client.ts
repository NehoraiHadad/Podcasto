import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createSupabaseServerClient,
  type SupabaseCookieOptions,
  type SupabaseCookieStore,
} from './server-client';
import type { Database } from './types';

type MiddlewareCookieStore = SupabaseCookieStore & {
  get: (name: string) => ReturnType<NextRequest['cookies']['get']>;
  set: (name: string, value: string, options?: SupabaseCookieOptions) => void;
  delete: (name: string, options?: SupabaseCookieOptions) => void;
  remove: (name: string, options?: SupabaseCookieOptions) => void;
};

function createMiddlewareCookieStore(
  request: NextRequest,
  response: NextResponse
): MiddlewareCookieStore {
  return {
    get(name) {
      return request.cookies.get(name) ?? undefined;
    },
    set(name, value, options) {
      request.cookies.set({ name, value, ...options });
      response.cookies.set({ name, value, ...options });
    },
    delete(name, options) {
      request.cookies.delete(name);
      response.cookies.set({
        name,
        value: '',
        ...options,
        maxAge: 0,
      });
    },
    remove(name, options) {
      request.cookies.delete(name);
      response.cookies.set({
        name,
        value: '',
        ...options,
        maxAge: 0,
      });
    },
  };
}

export function createSupabaseMiddlewareClient(
  request: NextRequest,
  response?: NextResponse
): { client: SupabaseClient<Database>; response: NextResponse } {
  const supabaseResponse =
    response ?? NextResponse.next({ request: { headers: request.headers } });

  const cookieStore = createMiddlewareCookieStore(request, supabaseResponse);
  const client = createSupabaseServerClient(cookieStore);

  return {
    client,
    response: supabaseResponse,
  };
}
