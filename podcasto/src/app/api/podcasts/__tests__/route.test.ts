import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
  isAdmin: vi.fn(),
}));

vi.mock('@/lib/db/api/podcasts/queries', () => ({
  getAllPodcastsBasic: vi.fn(),
  getPodcastsEligibleForMigration: vi.fn(),
}));

const { getUser, isAdmin } = vi.mocked(await import('@/lib/auth'));
const {
  getAllPodcastsBasic,
  getPodcastsEligibleForMigration,
} = vi.mocked(await import('@/lib/db/api/podcasts/queries'));

const { GET } = await import('../route');

describe('GET /api/podcasts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    getUser.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost/api/podcasts');
    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(getAllPodcastsBasic).not.toHaveBeenCalled();
    expect(getPodcastsEligibleForMigration).not.toHaveBeenCalled();
  });

  it('returns 403 when user is not an admin', async () => {
    getUser.mockResolvedValueOnce({ id: 'user-1' } as any);
    isAdmin.mockResolvedValueOnce(false);

    const request = new NextRequest('http://localhost/api/podcasts');
    const response = await GET(request);

    expect(response.status).toBe(403);
    expect(getAllPodcastsBasic).not.toHaveBeenCalled();
    expect(getPodcastsEligibleForMigration).not.toHaveBeenCalled();
  });

  it('fetches all podcasts for admin users by default', async () => {
    getUser.mockResolvedValueOnce({ id: 'admin-1' } as any);
    isAdmin.mockResolvedValueOnce(true);
    const podcasts = [
      { id: 'pod-1', created_at: new Date(), updated_at: new Date() },
    ];
    getAllPodcastsBasic.mockResolvedValueOnce(podcasts as any);

    const request = new NextRequest('http://localhost/api/podcasts');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getAllPodcastsBasic).toHaveBeenCalledTimes(1);
    expect(getPodcastsEligibleForMigration).not.toHaveBeenCalled();
    expect(body).toHaveLength(1);
  });

  it('fetches eligible podcasts when requested', async () => {
    getUser.mockResolvedValueOnce({ id: 'admin-2' } as any);
    isAdmin.mockResolvedValueOnce(true);
    const podcasts = [
      { id: 'pod-2', created_at: new Date(), updated_at: new Date() },
    ];
    getPodcastsEligibleForMigration.mockResolvedValueOnce(podcasts as any);

    const request = new NextRequest('http://localhost/api/podcasts?eligible_for_migration=true');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getPodcastsEligibleForMigration).toHaveBeenCalledTimes(1);
    expect(getAllPodcastsBasic).not.toHaveBeenCalled();
    expect(body).toHaveLength(1);
  });
});
