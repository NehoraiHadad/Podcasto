import { describe, it, expect, vi, afterEach } from 'vitest';
import type { DatabaseClient, GroupRecord, LanguageRecord } from '../fetch-groups';
vi.mock('@/lib/db', () => ({
  db: { select: vi.fn() },
}));

import { fetchPodcastGroupsWithLanguages } from '../fetch-groups';

type LanguageRow = LanguageRecord & { podcast_group_id: string };

type GroupBuilder = {
  from: ReturnType<typeof vi.fn<[], GroupBuilder>>;
  orderBy: ReturnType<typeof vi.fn<[unknown?], Promise<GroupRecord[]>>>;
};

type LanguageBuilder = {
  from: ReturnType<typeof vi.fn<[], LanguageBuilder>>;
  where: ReturnType<typeof vi.fn<[unknown?], LanguageBuilder>>;
  orderBy: ReturnType<typeof vi.fn<[unknown?], Promise<LanguageRow[]>>>;
};

afterEach(() => {
  vi.restoreAllMocks();
});

function createGroupBuilder(groups: GroupRecord[]): GroupBuilder {
  const builder: GroupBuilder = {
    from: vi.fn(() => builder),
    orderBy: vi.fn(async () => groups),
  };
  return builder;
}

function createLanguageBuilder(languages: LanguageRow[]): LanguageBuilder {
  const builder: LanguageBuilder = {
    from: vi.fn(() => builder),
    where: vi.fn(() => builder),
    orderBy: vi.fn(async () => languages),
  };
  return builder;
}

describe('fetchPodcastGroupsWithLanguages', () => {
  it('fetches groups and languages in batch', async () => {
    const groups: GroupRecord[] = [
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

    const languages: LanguageRow[] = [
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

    const select = vi.fn<[], GroupBuilder | LanguageBuilder>();
    select.mockReturnValueOnce(groupBuilder);
    select.mockReturnValueOnce(languageBuilder);

    const mockDb: DatabaseClient = {
      select: select as unknown as DatabaseClient['select'],
    };

    const result = await fetchPodcastGroupsWithLanguages(mockDb);

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

    const select = vi.fn<[], GroupBuilder | LanguageBuilder>();
    select.mockReturnValueOnce(groupBuilder);
    select.mockImplementation(() => {
      throw new Error('Languages should not be fetched when no groups exist');
    });

    const mockDb: DatabaseClient = {
      select: select as unknown as DatabaseClient['select'],
    };

    const result = await fetchPodcastGroupsWithLanguages(mockDb);

    expect(result).toEqual([]);
    expect(select).toHaveBeenCalledTimes(1);
    expect(groupBuilder.orderBy).toHaveBeenCalledTimes(1);
  });
});
