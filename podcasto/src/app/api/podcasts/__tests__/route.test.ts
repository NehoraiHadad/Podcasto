import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createAdminUser, createSupabaseUser } from '@/test/factories/user';
import type { Podcast } from '@/lib/db/api/podcasts/types';

vi.mock('@/lib/auth', () => ({
  SessionService: {
    getUser: vi.fn(),
  },
  isAdmin: vi.fn(),
}));

vi.mock('@/lib/db/api/podcasts/queries', () => ({
  getAllPodcastsBasic: vi.fn(),
  getPodcastsEligibleForMigration: vi.fn(),
}));

const { SessionService, isAdmin } = vi.mocked(await import('@/lib/auth'));
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
    SessionService.getUser.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost/api/podcasts');
    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(getAllPodcastsBasic).not.toHaveBeenCalled();
    expect(getPodcastsEligibleForMigration).not.toHaveBeenCalled();
  });

  it('returns 403 when user is not an admin', async () => {
    SessionService.getUser.mockResolvedValueOnce(
      createSupabaseUser({ id: 'user-1' })
    );
    isAdmin.mockResolvedValueOnce(false);

    const request = new NextRequest('http://localhost/api/podcasts');
    const response = await GET(request);

    expect(response.status).toBe(403);
    expect(getAllPodcastsBasic).not.toHaveBeenCalled();
    expect(getPodcastsEligibleForMigration).not.toHaveBeenCalled();
  });

  it('fetches all podcasts for admin users by default', async () => {
    SessionService.getUser.mockResolvedValueOnce(
      createAdminUser({ id: 'admin-1' })
    );
    isAdmin.mockResolvedValueOnce(true);
    const podcasts: Podcast[] = [createPodcast({ id: 'pod-1' })];
    getAllPodcastsBasic.mockResolvedValueOnce(podcasts);

    const request = new NextRequest('http://localhost/api/podcasts');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getAllPodcastsBasic).toHaveBeenCalledTimes(1);
    expect(getPodcastsEligibleForMigration).not.toHaveBeenCalled();
    expect(body).toHaveLength(1);
  });

  it('fetches eligible podcasts when requested', async () => {
    SessionService.getUser.mockResolvedValueOnce(
      createAdminUser({ id: 'admin-2' })
    );
    isAdmin.mockResolvedValueOnce(true);
    const podcasts: Podcast[] = [createPodcast({ id: 'pod-2' })];
    getPodcastsEligibleForMigration.mockResolvedValueOnce(podcasts);

    const request = new NextRequest('http://localhost/api/podcasts?eligible_for_migration=true');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getPodcastsEligibleForMigration).toHaveBeenCalledTimes(1);
    expect(getAllPodcastsBasic).not.toHaveBeenCalled();
    expect(body).toHaveLength(1);
  });
});

function createPodcast(overrides: Partial<Podcast> = {}): Podcast {
  const now = new Date();
  return {
    id: overrides.id ?? 'podcast-id',
    title: overrides.title ?? 'Podcast Title',
    description: overrides.description ?? null,
    cover_image: overrides.cover_image ?? null,
    image_style: overrides.image_style ?? null,
    is_paused: overrides.is_paused ?? false,
    created_by: overrides.created_by ?? null,
    podcast_group_id: overrides.podcast_group_id ?? null,
    language_code: overrides.language_code ?? null,
    migration_status: overrides.migration_status ?? 'legacy',
    auto_generation_enabled: overrides.auto_generation_enabled ?? null,
    last_auto_generated_at: overrides.last_auto_generated_at ?? null,
    next_scheduled_generation: overrides.next_scheduled_generation ?? null,
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
  };
}
