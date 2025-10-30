import { describe, expect, it } from 'vitest';
import { NextResponse } from 'next/server';

import { withSupabaseCookies } from '@/middleware';

describe('withSupabaseCookies', () => {
  it('copies cookies from the source response to the redirect response', () => {
    const source = NextResponse.next();
    source.cookies.set('sb-access-token', 'test-token', {
      path: '/',
    });

    const redirectResponse = NextResponse.redirect('https://example.com');
    const result = withSupabaseCookies(redirectResponse, source);

    expect(result.cookies.get('sb-access-token')?.value).toBe('test-token');
  });
});
