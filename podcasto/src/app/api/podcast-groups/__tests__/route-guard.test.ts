import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
  isAdmin: vi.fn(),
}));

vi.mock('../fetch-groups', () => ({
  fetchPodcastGroupsWithLanguages: vi.fn(),
}));

const { getUser, isAdmin } = vi.mocked(await import('@/lib/auth'));
const { fetchPodcastGroupsWithLanguages } = vi.mocked(
  await import('../fetch-groups')
);

const { GET } = await import('../route');

describe('GET /api/podcast-groups admin guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    getUser.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(fetchPodcastGroupsWithLanguages).not.toHaveBeenCalled();
  });

  it('returns 403 when user is not an admin', async () => {
    getUser.mockResolvedValueOnce({ id: 'user-1' } as any);
    isAdmin.mockResolvedValueOnce(false);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(fetchPodcastGroupsWithLanguages).not.toHaveBeenCalled();
  });

  it('returns podcast groups for admins', async () => {
    getUser.mockResolvedValueOnce({ id: 'admin-1' } as any);
    isAdmin.mockResolvedValueOnce(true);
    fetchPodcastGroupsWithLanguages.mockResolvedValueOnce([
      {
        id: 'group-1',
        created_at: new Date(),
        updated_at: new Date(),
        languages: [],
        language_count: 0,
      },
    ] as any);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(fetchPodcastGroupsWithLanguages).toHaveBeenCalledTimes(1);
    const body = await response.json();
    expect(body).toHaveLength(1);
  });
});
