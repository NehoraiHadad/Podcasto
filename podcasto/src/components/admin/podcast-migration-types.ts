export type MigrationPodcast = {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  created_at: string | null;
  updated_at: string | null;
  podcast_group_id: string | null;
};

export type MigrationGroupLanguage = {
  id: string;
  language_code: string;
  title: string;
  is_primary: boolean;
  podcast_id: string;
};

export type MigrationPodcastGroup = {
  id: string;
  base_title: string;
  base_description: string | null;
  base_cover_image: string | null;
  created_at: string | null;
  updated_at: string | null;
  language_count: number;
  languages: MigrationGroupLanguage[];
};
