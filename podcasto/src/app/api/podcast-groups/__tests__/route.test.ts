import { describe, it, expect, vi, afterEach } from 'vitest';
vi.mock('@/lib/db', () => ({
  db: { select: vi.fn() }
}));

import { fetchPodcastGroupsWithLanguages } from '../fetch-groups';

type GroupBuilder = {
  from: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
};

type LanguageBuilder = {
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
};

afterEach(() => {
  vi.restoreAllMocks();
});

function createGroupBuilder(groups: any[]): GroupBuilder {
  const builder: GroupBuilder = {
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(groups),
  };
  return builder;
}

function createLanguageBuilder(languages: any[]): LanguageBuilder {
  const builder: LanguageBuilder = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(languages),
  };
  return builder;
}

describe('fetchPodcastGroupsWithLanguages', () => {
  it('fetches groups and languages in batch', async () => {
    const groups = [
      {
        id: 'group-1',
        base_title: 'Group 1',
        base_description: null,
        base_cover_image: null,
        created_at: new Date('2024-01-01T00:00:00.000Z'),
        updated_at: new Date('2024-01-02T00:00:00.000Z'),
      },
      {
        id: 'group-2',
        base_title: 'Group 2',
        base_description: 'Description',
        base_cover_image: 'cover.jpg',
        created_at: new Date('2024-02-01T00:00:00.000Z'),
        updated_at: new Date('2024-02-02T00:00:00.000Z'),
      },
    ];

    const languages = [
      {
        id: 'lang-1',
        language_code: 'en',
        title: 'English',
        is_primary: true,
        podcast_id: 'pod-1',
        podcast_group_id: 'group-1',
      },
      {
        id: 'lang-2',
        language_code: 'he',
        title: 'Hebrew',
        is_primary: true,
        podcast_id: 'pod-2',
        podcast_group_id: 'group-2',
      },
    ];

    const groupBuilder = createGroupBuilder(groups);
    const languageBuilder = createLanguageBuilder(languages);

    const select = vi
      .fn()
      .mockReturnValueOnce(groupBuilder as unknown)
      .mockReturnValueOnce(languageBuilder as unknown);

    const mockDb = { select };

    const result = await fetchPodcastGroupsWithLanguages(mockDb as any);

    expect(select).toHaveBeenCalledTimes(2);
    expect(groupBuilder.orderBy).toHaveBeenCalledTimes(1);
    expect(languageBuilder.where).toHaveBeenCalledTimes(1);
    expect(languageBuilder.orderBy).toHaveBeenCalledTimes(1);

    expect(result).toEqual([
      {
        ...groups[0],
        languages: [
          {
            id: 'lang-1',
            language_code: 'en',
            title: 'English',
            is_primary: true,
            podcast_id: 'pod-1',
          },
        ],
        language_count: 1,
      },
      {
        ...groups[1],
        languages: [
          {
            id: 'lang-2',
            language_code: 'he',
            title: 'Hebrew',
            is_primary: true,
            podcast_id: 'pod-2',
          },
        ],
        language_count: 1,
      },
    ]);
  });

  it('skips language lookup when no groups exist', async () => {
    const groupBuilder = createGroupBuilder([]);

    const select = vi
      .fn()
      .mockReturnValueOnce(groupBuilder as unknown)
      .mockImplementation(() => {
        throw new Error('Languages should not be fetched when no groups exist');
      });

    const mockDb = { select };

    const result = await fetchPodcastGroupsWithLanguages(mockDb as any);

    expect(result).toEqual([]);
    expect(select).toHaveBeenCalledTimes(1);
    expect(groupBuilder.orderBy).toHaveBeenCalledTimes(1);
  });
});
