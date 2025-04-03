# Podcast Server Actions

## Important: Direct Import Pattern

In Next.js 14+, you **cannot** re-export server actions from a central file like `index.ts`.
Instead, you must import each server action directly from its source file:

```typescript
// CORRECT ✅
import { createPodcast } from '@/lib/actions/podcast/create';
import { updatePodcast } from '@/lib/actions/podcast/update';
import { deletePodcast } from '@/lib/actions/podcast/delete';
import { generatePodcastEpisode } from '@/lib/actions/podcast/generate';

// INCORRECT ❌
import { createPodcast, updatePodcast } from '@/lib/actions/podcast';
```

## Rules for Server Actions

1. Server actions must be in files with `'use server'` directive
2. All exported functions must be `async` functions
3. You cannot re-export functions from a server action file
4. Use direct imports for each function from its source file

## Types

Types are available via:

```typescript
import type { ActionResponse } from '@/lib/actions/podcast/types';
``` 