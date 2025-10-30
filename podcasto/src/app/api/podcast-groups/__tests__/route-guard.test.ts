import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createAdminUser, createSupabaseUser } from '@/test/factories/user';
import type { GroupWithLanguages } from '../fetch-groups';

vi.mock('@/lib/auth', () => ({
  SessionService: {
    getUser: vi.fn(),
  },
  isAdmin: vi.fn(),
}));

vi.mock('../fetch-groups', () => ({
  fetchPodcastGroupsWithLanguages: vi.fn(),
}));

const { SessionService, isAdmin } = vi.mocked(await import('@/lib/auth/server'));
const { fetchPodcastGroupsWithLanguages } = vi.mocked(
  await import('../fetch-groups')
);

const { GET } = await import('../route');

describe('GET /api/podcast-groups admin guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    SessionService.getUser.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(fetchPodcastGroupsWithLanguages).not.toHaveBeenCalled();
  });

  it('returns 403 when user is not an admin', async () => {
    SessionService.getUser.mockResolvedValueOnce(
      createSupabaseUser({ id: 'user-1' })
    );
    isAdmin.mockResolvedValueOnce(false);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(fetchPodcastGroupsWithLanguages).not.toHaveBeenCalled();
  });

  it('returns podcast groups for admins', async () => {
    SessionService.getUser.mockResolvedValueOnce(
      createAdminUser({ id: 'admin-1' })
    );
    isAdmin.mockResolvedValueOnce(true);
    fetchPodcastGroupsWithLanguages.mockResolvedValueOnce([
      {
        id: 'group-1',
        base_title: 'Group 1',
        base_description: null,
        base_cover_image: null,
        created_at: new Date(),
        updated_at: new Date(),
        languages: [],
        language_count: 0,
      },
    ] satisfies GroupWithLanguages[]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(fetchPodcastGroupsWithLanguages).toHaveBeenCalledTimes(1);
    const body = await response.json();
    expect(body).toHaveLength(1);
  });
});
