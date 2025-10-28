# Podcast Form Core Sections

This directory contains modular, reusable form sections for building podcast creation and editing forms throughout the application.

## Overview

Each section is a self-contained React component that:
- Uses React Hook Form for validation and state management
- Integrates with shadcn/ui components
- Follows TypeScript best practices
- Is under 150 lines of code
- Can be composed with other sections

## Available Sections

### 1. BasicInfoSection
**Fields:** title, description, language
**Usage:** Essential podcast metadata

```tsx
import { BasicInfoSection } from '@/components/podcasts/forms/core';

<BasicInfoSection control={form.control} disabled={false} />
```

### 2. ContentSourceSection
**Fields:** contentSource (radio), telegramChannelName, rssUrl
**Usage:** Choose content source with conditional fields

```tsx
import { ContentSourceSection } from '@/components/podcasts/forms/core';

<ContentSourceSection control={form.control} />
```

### 3. FormatSection
**Fields:** podcastFormat, speaker1Role, speaker2Role
**Usage:** Podcast format selection with speaker roles

```tsx
import { FormatSection } from '@/components/podcasts/forms/core';

<FormatSection
  control={form.control}
  setValue={form.setValue}
/>
```

### 4. ScheduleSection
**Fields:** episodeFrequency, autoGeneration
**Usage:** Episode scheduling configuration

```tsx
import { ScheduleSection } from '@/components/podcasts/forms/core';

<ScheduleSection control={form.control} />
```

### 5. StyleSection
**Fields:** conversationStyle, introPrompt, outroPrompt
**Usage:** Podcast style and custom prompts

```tsx
import { StyleSection } from '@/components/podcasts/forms/core';

<StyleSection control={form.control} />
```

### 6. ImageUploadSection
**Fields:** coverImage
**Usage:** Image upload with preview and AI generation option

```tsx
import { ImageUploadSection } from '@/components/podcasts/forms/core';

<ImageUploadSection
  control={form.control}
  onAiGenerate={() => console.log('Generate AI image')}
/>
```

## Example: Composing a Complete Form

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import {
  BasicInfoSection,
  ContentSourceSection,
  FormatSection,
  ScheduleSection,
  StyleSection,
  ImageUploadSection,
} from '@/components/podcasts/forms/core';

export function MyPodcastForm() {
  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      language: 'en',
      contentSource: 'telegram',
      telegramChannelName: '',
      rssUrl: '',
      podcastFormat: 'multi-speaker',
      speaker1Role: 'host',
      speaker2Role: 'expert',
      episodeFrequency: 'weekly',
      autoGeneration: true,
      conversationStyle: 'professional',
      introPrompt: '',
      outroPrompt: '',
      coverImage: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <BasicInfoSection control={form.control} />
        <ContentSourceSection control={form.control} />
        <FormatSection control={form.control} setValue={form.setValue} />
        <ScheduleSection control={form.control} />
        <StyleSection control={form.control} />
        <ImageUploadSection control={form.control} />

        <button type="submit">Create Podcast</button>
      </form>
    </Form>
  );
}
```

## Design Principles

1. **Composability**: Sections can be used independently or together
2. **Consistency**: All sections follow the same prop interface pattern
3. **Type Safety**: Full TypeScript support with proper type inference
4. **Accessibility**: Built on accessible shadcn/ui components
5. **Maintainability**: Small, focused components under 150 lines

## Props Interface

All sections accept:

```typescript
interface SectionProps {
  control: Control<any>;  // React Hook Form control
  disabled?: boolean;     // Optional disabled state
}
```

Some sections have additional optional props:
- **FormatSection**: `setValue?: (name: string, value: any) => void`
- **ImageUploadSection**: `onAiGenerate?: () => void`

## Field Names Convention

Field names match the database schema where applicable:
- `title` → podcasts.title
- `description` → podcasts.description
- `podcastFormat` → podcast_configs.podcast_format
- `speaker1Role` → podcast_configs.speaker1_role
- `speaker2Role` → podcast_configs.speaker2_role
- etc.

## Next Steps

These sections form Phase 1 of the podcast forms refactoring. Future phases will:
1. Create composite forms using these sections
2. Migrate existing forms to use these sections
3. Add validation schemas for each section
4. Create Storybook stories for visual testing
