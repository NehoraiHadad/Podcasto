import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';
import type { UpdateSessionResult } from '@/lib/auth/session/middleware';

const updateSessionMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session/middleware', () => ({
  updateSession: updateSessionMock,
}));

describe('middleware cookie forwarding', () => {
  afterEach(() => {
    updateSessionMock.mockReset();
  });

  it('forwards cookies from session response to redirect response', async () => {
    const sessionResponse = NextResponse.next();
    sessionResponse.cookies.set('sb', 'value');

    updateSessionMock.mockResolvedValue({
      response: sessionResponse,
      userResult: { data: { user: null } } as UpdateSessionResult['userResult'],
    } satisfies UpdateSessionResult);

    const request = new NextRequest('https://example.com/profile');
    const result = await middleware(request);

    expect(result.status).toBe(307);
    expect(result.headers.get('location')).toBe(
      'https://example.com/auth/login?redirect=%2Fprofile'
    );
    expect(result.cookies.get('sb')?.value).toBe('value');
  });
});
