'use client';

import { useRouter } from 'next/navigation';
import { LanguageSwitcher, type LanguageOption } from '@/components/podcasts/language-switcher';
import type { PodcastGroupWithLanguages } from '@/lib/db/api/podcast-groups';

interface PodcastDetailsLanguageSwitcherProps {
  podcastGroup: PodcastGroupWithLanguages;
  currentPodcastId: string;
}

/**
 * Client wrapper for language switcher on podcast details page
 * Handles navigation between language variants
 */
export function PodcastDetailsLanguageSwitcher({
  podcastGroup,
  currentPodcastId
}: PodcastDetailsLanguageSwitcherProps) {
  const router = useRouter();

  // Find current language based on podcast ID
  const currentLanguage = podcastGroup.languages.find(
    lang => lang.podcast_id === currentPodcastId
  )?.language_code || podcastGroup.languages[0]?.language_code;

  // Map podcast group languages to language options
  const availableLanguages: LanguageOption[] = podcastGroup.languages.map(lang => ({
    code: lang.language_code,
    title: lang.title
  }));

  const handleLanguageChange = (languageCode: string) => {
    const selectedLanguage = podcastGroup.languages.find(
      lang => lang.language_code === languageCode
    );

    if (selectedLanguage && selectedLanguage.podcast_id) {
      router.push(`/podcasts/${selectedLanguage.podcast_id}`);
    }
  };

  // Only render if there are multiple languages
  if (availableLanguages.length <= 1) {
    return null;
  }

  return (
    <LanguageSwitcher
      currentLanguage={currentLanguage}
      availableLanguages={availableLanguages}
      onLanguageChange={handleLanguageChange}
      className="mb-4"
    />
  );
}
