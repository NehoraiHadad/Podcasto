import { describe, expect, it, vi, afterEach, type Mock } from 'vitest';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core/dialect';

vi.mock('../../utils', () => ({
  findBy: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  updateById: vi.fn(),
  deleteById: vi.fn(),
  getAll: vi.fn(),
  getPaginated: vi.fn(),
  count: vi.fn(),
  exists: vi.fn(),
}));

import { getPodcastsEligibleForMigration } from './queries';
import { podcasts } from '../../schema';
import type { Podcast } from './types';
import * as dbUtils from '../../utils';

describe('podcast queries', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPodcastsEligibleForMigration', () => {
    it('queries podcasts with null podcast_group_id', async () => {
      const mockPodcasts: Podcast[] = [
        {
          id: 'pod-1',
          title: 'Eligible Podcast',
          description: null,
          cover_image: null,
          image_style: null,
          is_paused: false,
          created_by: null,
          podcast_group_id: null,
          language_code: 'en',
          migration_status: 'legacy',
          auto_generation_enabled: null,
          last_auto_generated_at: null,
          next_scheduled_generation: null,
          created_at: new Date('2024-01-01T00:00:00.000Z'),
          updated_at: new Date('2024-01-02T00:00:00.000Z'),
        },
      ];

      const findByMock = dbUtils.findBy as unknown as Mock;
      findByMock.mockImplementation(async (_table, condition: SQL) => {
        const dialect = new PgDialect();
        const query = dialect.sqlToQuery(condition);

        expect(query.sql.toLowerCase()).toContain('is null');
        expect(query.sql.toLowerCase()).toContain('podcast_group_id');

        return mockPodcasts;
      });

      const result = await getPodcastsEligibleForMigration();

      expect(findByMock).toHaveBeenCalledWith(
        podcasts,
        expect.any(Object)
      );
      expect(result).toEqual(mockPodcasts);
    });
  });
});
