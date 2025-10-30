import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signUpWithPassword } from '@/lib/actions/auth-actions';

const getURLMock = vi.hoisted(() => vi.fn(() => 'https://example.com/'));
const runAuthActionMock = vi.hoisted(() => vi.fn());
const supabaseSignUpMock = vi.hoisted(() => vi.fn());
const validateRegistrationMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/utils/url', () => ({
  getURL: getURLMock,
}));

vi.mock('@/lib/actions/shared', async () => {
  const actual = await vi.importActual<typeof import('@/lib/actions/shared')>('@/lib/actions/shared');

  return {
    ...actual,
    runAuthAction: runAuthActionMock,
  };
});

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');

  return {
    ...actual,
    validateRegistration: validateRegistrationMock,
  };
});

describe('signUpWithPassword', () => {
  beforeEach(() => {
    getURLMock.mockReturnValue('https://example.com/');
    supabaseSignUpMock.mockReset();
    runAuthActionMock.mockReset();
    validateRegistrationMock.mockReset();

    runAuthActionMock.mockImplementation(async (callback) => {
      const data = await callback({
        auth: {
          signUp: supabaseSignUpMock,
        },
      } as never);

      return { success: true, data };
    });
  });

  it('uses validated credentials when confirmPassword is provided', async () => {
    const supabaseResponse = { user: { id: 'user-123' } };

    supabaseSignUpMock.mockResolvedValue({
      data: supabaseResponse,
      error: null,
    });
    validateRegistrationMock.mockReturnValue({
      success: true,
      data: {
        email: 'validated@example.com',
        password: 'validated-password',
      },
    });

    const result = await signUpWithPassword('original@example.com', 'original-password', 'original-password');

    expect(validateRegistrationMock).toHaveBeenCalledWith({
      email: 'original@example.com',
      password: 'original-password',
      confirmPassword: 'original-password',
    });
    expect(supabaseSignUpMock).toHaveBeenCalledWith({
      email: 'validated@example.com',
      password: 'validated-password',
      options: { emailRedirectTo: 'https://example.com/auth/callback' },
    });
    expect(runAuthActionMock).toHaveBeenCalledOnce();
    expect(runAuthActionMock.mock.calls[0]?.[1]).toEqual({
      logContext: {
        action: 'signUpWithPassword',
        email: 'original@example.com',
      },
    });
    expect(result).toEqual({ success: true, data: supabaseResponse });
  });

  it('uses raw credentials and legacy log context when confirmPassword is omitted', async () => {
    const supabaseResponse = { user: { id: 'legacy-user' } };

    supabaseSignUpMock.mockResolvedValue({
      data: supabaseResponse,
      error: null,
    });

    const result = await signUpWithPassword('legacy@example.com', 'legacy-password');

    expect(validateRegistrationMock).not.toHaveBeenCalled();
    expect(supabaseSignUpMock).toHaveBeenCalledWith({
      email: 'legacy@example.com',
      password: 'legacy-password',
      options: { emailRedirectTo: 'https://example.com/auth/callback' },
    });
    expect(runAuthActionMock).toHaveBeenCalledOnce();
    expect(runAuthActionMock.mock.calls[0]?.[1]).toEqual({
      logContext: {
        action: 'signUpWithPassword',
        email: 'legacy@example.com',
        legacyValidation: true,
      },
    });
    expect(result).toEqual({ success: true, data: supabaseResponse });
  });
});
