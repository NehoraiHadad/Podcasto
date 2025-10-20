# Multilingual Podcast Components - Usage Guide

This directory contains user-facing UI components for multilingual podcast support. All components have built-in RTL (Right-to-Left) support for Hebrew, Arabic, and other RTL languages.

## Components

### 1. LanguageBadge

Small badge displaying podcast language with flag emoji and proper text direction.

**Features:**
- Automatic RTL support for Hebrew, Arabic
- Flag emoji + language name
- Optional native name display
- Semantic HTML with ARIA labels

**Usage:**
```tsx
import { LanguageBadge } from '@/components/podcasts/language-badge';

// English name
<LanguageBadge languageCode="he" />
// Renders: 🇮🇱 Hebrew

// Native name (recommended for user-facing UI)
<LanguageBadge languageCode="he" useNativeName />
// Renders: 🇮🇱 עברית (with RTL direction)

// Custom styling
<LanguageBadge
  languageCode="ar"
  useNativeName
  className="text-lg"
/>
```

### 2. LanguageSwitcher

Tab-based language switcher for switching between podcast variants.

**Features:**
- Smooth transitions between languages
- Keyboard accessible (Tab + Arrow keys)
- Auto-hides when only one language available
- RTL support per language
- Focus ring for accessibility

**Usage:**
```tsx
'use client';

import { LanguageSwitcher } from '@/components/podcasts/language-switcher';
import { useRouter } from 'next/navigation';

export function PodcastLanguageSelector() {
  const router = useRouter();

  return (
    <LanguageSwitcher
      currentLanguage="he"
      availableLanguages={[
        { code: 'he', title: 'Hebrew Edition' },
        { code: 'en', title: 'English Edition' },
        { code: 'ar', title: 'Arabic Edition' }
      ]}
      onLanguageChange={(code) => {
        router.push(`/podcasts/abuali-express?lang=${code}`);
      }}
    />
  );
}
```

### 3. SubscriptionLanguageSelector

Radio group for selecting preferred language when subscribing.

**Features:**
- Radio button selection
- Flag + native name + title
- Highlights primary language
- Auto-selects single language
- Hover states and focus rings
- Fully keyboard accessible

**Usage:**
```tsx
'use client';

import { SubscriptionLanguageSelector } from '@/components/podcasts/subscription-language-selector';
import { useState } from 'react';

export function SubscriptionForm() {
  const [selectedLanguage, setSelectedLanguage] = useState('he');

  return (
    <form>
      <h3>Choose your preferred language</h3>
      <SubscriptionLanguageSelector
        languages={[
          {
            code: 'he',
            title: 'Hebrew Edition - Daily News',
            is_primary: true
          },
          {
            code: 'en',
            title: 'English Edition - Weekly Summary'
          }
        ]}
        defaultLanguage="he"
        value={selectedLanguage}
        onSelect={setSelectedLanguage}
      />

      <button type="submit">Subscribe</button>
    </form>
  );
}
```

### 4. GroupedPodcastCard

Podcast card displaying multiple language variants with clickable badges.

**Features:**
- Displays current language variant
- Shows all available languages as clickable badges
- Smooth hover effects on language badges
- Responsive image loading with Next.js Image
- Focus rings and ARIA attributes
- Mobile-first responsive design

**Usage:**
```tsx
import { GroupedPodcastCard } from '@/components/podcasts/grouped-podcast-card';

export async function PodcastGrid({ groups }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((group) => (
        <GroupedPodcastCard
          key={group.id}
          podcastGroup={{
            id: group.id,
            name: group.name,
            slug: group.slug,
            languages: [
              {
                code: 'he',
                title: 'עדכון יומי בעברית',
                description: 'חדשות היום בפודקאסט של 5 דקות',
                podcast_id: 'podcast-123',
                episode_count: 42,
                cover_image: '/images/podcast-he.jpg',
                is_primary: true
              },
              {
                code: 'en',
                title: 'Daily Update in English',
                description: 'Today\'s news in a 5-minute podcast',
                podcast_id: 'podcast-456',
                episode_count: 38,
                cover_image: '/images/podcast-en.jpg'
              }
            ]
          }}
          currentLanguage="he"
        />
      ))}
    </div>
  );
}
```

## RTL Support

All components automatically handle RTL text direction:

- **Hebrew (he)**: Right-to-Left
- **Arabic (ar)**: Right-to-Left
- **All others**: Left-to-Right

The `dir` attribute is set automatically based on language code using the `getLanguageDirection()` utility.

### Example: Mixed LTR/RTL Content

```tsx
<div className="flex gap-2">
  <LanguageBadge languageCode="en" useNativeName />
  {/* English text flows LTR */}

  <LanguageBadge languageCode="he" useNativeName />
  {/* Hebrew text flows RTL */}

  <LanguageBadge languageCode="ar" useNativeName />
  {/* Arabic text flows RTL */}
</div>
```

## Accessibility Features

All components include:

1. **Keyboard Navigation**: Full support for Tab, Enter, Arrow keys
2. **Focus Indicators**: Visible focus rings meeting WCAG 2.1 standards
3. **ARIA Labels**: Descriptive labels for screen readers
4. **Semantic HTML**: Proper use of `<button>`, `<a>`, `<label>`, etc.
5. **Color Contrast**: All text meets WCAG AA contrast ratios
6. **State Communication**: `aria-current`, `aria-label`, `role` attributes

## Integration with Existing Podcast Components

These components work alongside the existing `PodcastCard` component system:

```tsx
// Traditional single-language podcast card
import { PodcastCard } from '@/components/podcasts/podcast-card';

<PodcastCard podcast={podcast} />

// New multilingual grouped card
import { GroupedPodcastCard } from '@/components/podcasts/grouped-podcast-card';

<GroupedPodcastCard podcastGroup={group} currentLanguage="he" />
```

## TypeScript Support

All components are fully typed with exported interfaces:

```tsx
import type {
  LanguageBadgeProps,
  LanguageSwitcherProps,
  LanguageOption,
  SubscriptionLanguageSelectorProps,
  PodcastLanguage,
  GroupedPodcastCardProps,
  PodcastGroupWithLanguages,
  PodcastGroupLanguage
} from '@/components/podcasts/multilingual';
```

## Mobile Responsiveness

All components are mobile-first:

- **LanguageBadge**: Compact size, readable on small screens
- **LanguageSwitcher**: Horizontal scrolling on mobile if many languages
- **SubscriptionLanguageSelector**: Stacks vertically on mobile
- **GroupedPodcastCard**: Full-width on mobile, grid on tablet/desktop

## Performance Considerations

- **Server Components**: `LanguageBadge` and parts of `GroupedPodcastCard` are server components
- **Client Components**: Only interactive components use `'use client'` directive
- **Image Optimization**: `GroupedPodcastCard` uses Next.js `<Image>` with responsive sizes
- **Code Splitting**: Each component can be imported independently

## Example: Complete Multilingual Podcast Page

```tsx
import { LanguageSwitcher } from '@/components/podcasts/language-switcher';
import { GroupedPodcastCard } from '@/components/podcasts/grouped-podcast-card';

export default async function PodcastGroupPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { lang?: string };
}) {
  const group = await getPodcastGroupBySlug(params.slug);
  const currentLang = searchParams.lang || group.primary_language;

  return (
    <main className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{group.name}</h1>

        <LanguageSwitcher
          currentLanguage={currentLang}
          availableLanguages={group.languages.map(l => ({
            code: l.code,
            title: l.title
          }))}
          onLanguageChange={(code) => {
            router.push(`/podcasts/${params.slug}?lang=${code}`);
          }}
        />
      </div>

      <GroupedPodcastCard
        podcastGroup={group}
        currentLanguage={currentLang}
      />
    </main>
  );
}
```

## Testing RTL Layouts

To test RTL layouts during development:

```tsx
// Force RTL direction for testing
<div dir="rtl">
  <LanguageBadge languageCode="he" useNativeName />
</div>

// Test mixed directions
<div className="flex gap-4">
  <div dir="ltr">
    <LanguageBadge languageCode="en" useNativeName />
  </div>
  <div dir="rtl">
    <LanguageBadge languageCode="he" useNativeName />
  </div>
</div>
```
