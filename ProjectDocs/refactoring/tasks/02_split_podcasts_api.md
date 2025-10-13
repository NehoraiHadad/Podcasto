# משימה 2.2: Split Podcasts API

## מטרה
פיצול `src/lib/db/api/podcasts.ts` (245 שורות) למודולים קטנים וממוקדים

## עדיפות: 🔴 גבוהה
## זמן משוער: 3-4 שעות
## תחום: Database Layer (02)

---

## 📊 מצב נוכחי

### הקובץ הקיים
- **Path**: `src/lib/db/api/podcasts.ts`
- **Size**: 245 שורות
- **Functions**: ~15 functions
- **בעיות**:
  - קובץ גדול מדי
  - ערבוב של read/write operations
  - קשה לנווט ולתחזק

### Functions List
```typescript
// Read Operations (~120 שורות)
- getPodcastById
- getPodcastByIdWithRelations
- getAllPodcasts
- getActivePodcasts
- getPodcastCount
- getPodcastWithConfig
- getPodcastWithEpisodes

// Write Operations (~80 שורות)
- createPodcast
- updatePodcast
- deletePodcast
- togglePodcastActive

// Helper Functions (~45 שורות)
- buildPodcastQuery
- formatPodcastData
- validatePodcastData
```

---

## 🎯 מבנה מוצע

### New Structure
```
src/lib/db/api/podcasts/
├── index.ts              (~30 שורות) - Re-exports
├── queries.ts            (~100 שורות) - Read operations
├── mutations.ts          (~80 שורות) - Write operations
├── relations.ts          (~60 שורות) - Complex relation queries
├── utils.ts              (~40 שורות) - Helper functions
└── types.ts              (~20 שורות) - Shared types
```

---

## 📚 דוקומנטציה רלוונטית

### Drizzle ORM Patterns
**Queries Best Practices**
- https://orm.drizzle.team/docs/select
- Always select specific columns (not *)
- Use prepared statements for performance

**Relations**
- https://orm.drizzle.team/docs/rqb
- Use `with` to fetch relations in one query
- Avoid N+1 by loading related data upfront

### File Organization
**Clean Architecture**
- Separate read from write (CQRS pattern)
- Group by feature, not by type
- Keep files under 150 lines

---

## 📝 שלבי ביצוע

### Step 1: יצירת תיקייה ו-types (30 דק')

```bash
mkdir -p src/lib/db/api/podcasts
```

**קובץ**: `podcasts/types.ts`
```typescript
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { podcasts } from '@/lib/db/schema';

export type Podcast = InferSelectModel<typeof podcasts>;
export type NewPodcast = InferInsertModel<typeof podcasts>;

export type PodcastWithRelations = Podcast & {
  episodes?: Episode[];
  config?: PodcastConfig;
  subscriptions?: Subscription[];
};

export type PodcastQueryOptions = {
  includeInactive?: boolean;
  includeConfig?: boolean;
  includeEpisodes?: boolean;
  episodesLimit?: number;
};
```

---

### Step 2: העברת Query Functions (1 שעה)

**קובץ**: `podcasts/queries.ts`
```typescript
import { db } from '@/lib/db';
import { podcasts, podcastConfigs, episodes } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { Podcast, PodcastWithRelations, PodcastQueryOptions } from './types';

/**
 * Get podcast by ID
 * @param id - Podcast ID
 * @returns Podcast or null if not found
 */
export async function getPodcastById(id: string): Promise<Podcast | null> {
  const [podcast] = await db
    .select()
    .from(podcasts)
    .where(eq(podcasts.id, id))
    .limit(1);

  return podcast || null;
}

/**
 * Get podcast with relations
 * @param id - Podcast ID
 * @param options - Query options
 * @returns Podcast with requested relations or null
 */
export async function getPodcastWithRelations(
  id: string,
  options: PodcastQueryOptions = {}
): Promise<PodcastWithRelations | null> {
  const withClause: Record<string, any> = {};

  if (options.includeConfig) {
    withClause.config = true;
  }

  if (options.includeEpisodes) {
    withClause.episodes = {
      limit: options.episodesLimit || 10,
      orderBy: [desc(episodes.published_at)]
    };
  }

  const podcast = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, id),
    with: withClause
  });

  return podcast || null;
}

/**
 * Get all podcasts
 * @param includeInactive - Include inactive podcasts
 * @returns Array of podcasts
 */
export async function getAllPodcasts(
  includeInactive = false
): Promise<Podcast[]> {
  const conditions = includeInactive
    ? undefined
    : eq(podcasts.is_active, true);

  return db.query.podcasts.findMany({
    where: conditions,
    orderBy: [desc(podcasts.created_at)]
  });
}

/**
 * Get podcast count
 * @returns Total number of podcasts
 */
export async function getPodcastCount(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(podcasts);

  return result[0]?.count || 0;
}

// Add more query functions...
```

---

### Step 3: העברת Mutation Functions (45 דק')

**קובץ**: `podcasts/mutations.ts`
```typescript
import { db } from '@/lib/db';
import { podcasts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { NewPodcast, Podcast } from './types';

/**
 * Create a new podcast
 * @param data - Podcast data
 * @returns Created podcast
 */
export async function createPodcast(data: NewPodcast): Promise<Podcast> {
  const [podcast] = await db
    .insert(podcasts)
    .values({
      ...data,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning();

  return podcast;
}

/**
 * Update podcast
 * @param id - Podcast ID
 * @param data - Updated data
 * @returns Updated podcast or null
 */
export async function updatePodcast(
  id: string,
  data: Partial<NewPodcast>
): Promise<Podcast | null> {
  const [podcast] = await db
    .update(podcasts)
    .set({
      ...data,
      updated_at: new Date()
    })
    .where(eq(podcasts.id, id))
    .returning();

  return podcast || null;
}

/**
 * Delete podcast
 * @param id - Podcast ID
 * @returns true if deleted, false if not found
 */
export async function deletePodcast(id: string): Promise<boolean> {
  const result = await db
    .delete(podcasts)
    .where(eq(podcasts.id, id))
    .returning();

  return result.length > 0;
}

/**
 * Toggle podcast active status
 * @param id - Podcast ID
 * @returns Updated podcast or null
 */
export async function togglePodcastActive(id: string): Promise<Podcast | null> {
  // First get current status
  const podcast = await getPodcastById(id);
  if (!podcast) return null;

  return updatePodcast(id, { is_active: !podcast.is_active });
}
```

---

### Step 4: יצירת Relations Module (45 דק')

**קובץ**: `podcasts/relations.ts`
```typescript
import { db } from '@/lib/db';
import { podcasts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PodcastWithRelations } from './types';

/**
 * Get podcast with full relations (config + episodes + subscriptions)
 * @param id - Podcast ID
 * @returns Podcast with all relations or null
 */
export async function getPodcastWithAllRelations(
  id: string
): Promise<PodcastWithRelations | null> {
  const podcast = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, id),
    with: {
      config: true,
      episodes: {
        limit: 50,
        orderBy: [desc(episodes.published_at)]
      },
      subscriptions: {
        with: {
          profile: true
        }
      }
    }
  });

  return podcast || null;
}

/**
 * Get podcast with latest episodes
 * @param id - Podcast ID
 * @param limit - Number of episodes to fetch
 * @returns Podcast with episodes or null
 */
export async function getPodcastWithLatestEpisodes(
  id: string,
  limit = 10
): Promise<PodcastWithRelations | null> {
  const podcast = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, id),
    with: {
      episodes: {
        limit,
        where: eq(episodes.status, 'completed'),
        orderBy: [desc(episodes.published_at)]
      }
    }
  });

  return podcast || null;
}

// Add more relation queries...
```

---

### Step 5: יצירת Utils (30 דק')

**קובץ**: `podcasts/utils.ts`
```typescript
import type { Podcast, PodcastWithRelations } from './types';

/**
 * Format podcast data for API response
 * @param podcast - Raw podcast data
 * @returns Formatted podcast
 */
export function formatPodcastData(podcast: Podcast): Podcast {
  return {
    ...podcast,
    // Add any transformations here
    cover_image: podcast.cover_image || null,
    language: podcast.language || 'english'
  };
}

/**
 * Check if podcast has active episodes
 * @param podcast - Podcast with episodes
 * @returns true if has active episodes
 */
export function hasActiveEpisodes(
  podcast: PodcastWithRelations
): boolean {
  return (podcast.episodes?.length ?? 0) > 0;
}

/**
 * Get podcast status label
 * @param podcast - Podcast
 * @returns Status label
 */
export function getPodcastStatusLabel(podcast: Podcast): string {
  if (!podcast.is_active) return 'Inactive';
  if (podcast.language === 'hebrew') return 'פעיל';
  return 'Active';
}

// Add more utility functions...
```

---

### Step 6: יצירת Index (Re-exports) (15 דק')

**קובץ**: `podcasts/index.ts`
```typescript
// Types
export type {
  Podcast,
  NewPodcast,
  PodcastWithRelations,
  PodcastQueryOptions
} from './types';

// Queries (read operations)
export {
  getPodcastById,
  getPodcastWithRelations,
  getAllPodcasts,
  getPodcastCount,
  getActivePodcasts
} from './queries';

// Mutations (write operations)
export {
  createPodcast,
  updatePodcast,
  deletePodcast,
  togglePodcastActive
} from './mutations';

// Relations
export {
  getPodcastWithAllRelations,
  getPodcastWithLatestEpisodes
} from './relations';

// Utils
export {
  formatPodcastData,
  hasActiveEpisodes,
  getPodcastStatusLabel
} from './utils';
```

---

### Step 7: עדכון Imports בקוד קיים (30 דק')

חפש והחלף את כל ה-imports:

```typescript
// ❌ Before
import { getPodcastById } from '@/lib/db/api/podcasts';

// ✅ After (same API!)
import { getPodcastById } from '@/lib/db/api/podcasts';
// The index.ts re-exports everything, so no changes needed!
```

---

### Step 8: מחיקת הקובץ הישן (5 דק')

```bash
# Backup first
mv src/lib/db/api/podcasts.ts src/lib/db/api/podcasts.ts.backup

# Test everything works

# Delete backup after confirmation
rm src/lib/db/api/podcasts.ts.backup
```

---

## ✅ Checklist ביצוע

### Pre-Work
- [ ] קרא את הקובץ הקיים בשלמותו
- [ ] הבן את כל ה-functions וה-dependencies שלהם
- [ ] רשום רשימה של כל ה-callers (מי משתמש בפונקציות האלה)
- [ ] בדוק שאין circular dependencies

### During Work
- [ ] צור את תיקיית podcasts/
- [ ] צור types.ts עם כל ה-types
- [ ] העבר queries.ts (קרא בלבד)
- [ ] העבר mutations.ts (כתיבה)
- [ ] צור relations.ts (queries מורכבים)
- [ ] צור utils.ts (helpers)
- [ ] צור index.ts (re-exports)
- [ ] הוסף JSDoc לכל function
- [ ] וודא return types מוגדרים

### Post-Work
- [ ] הרץ `npm run typecheck` - וודא אין שגיאות
- [ ] הרץ `npm run lint` - תקן warnings
- [ ] הרץ `npm run build` - וודא build עובר
- [ ] בדוק שכל הדפים הרלוונטיים עובדים:
  - [ ] /admin/podcasts
  - [ ] /admin/podcasts/[id]
  - [ ] /podcasts
  - [ ] /podcasts/[id]
- [ ] מחק את הקובץ הישן
- [ ] עדכן README אם צריך

---

## 🎯 קריטריונים להצלחה

### Structure
- [ ] כל קובץ מתחת ל-150 שורות
- [ ] הפרדה ברורה: queries / mutations / relations
- [ ] index.ts מאפשר imports נוחים

### Code Quality
- [ ] כל function עם JSDoc
- [ ] Return types מפורשים
- [ ] Error handling consistent
- [ ] אין any types

### Functionality
- [ ] כל הפונקציות עובדות כמו קודם
- [ ] אין regression bugs
- [ ] Performance לא נפגע
- [ ] All tests pass (אם יש)

---

## 📝 הערות חשובות

### על Drizzle Relations
```typescript
// ✅ Good: Load relations in one query
const podcast = await db.query.podcasts.findFirst({
  with: {
    episodes: true,
    config: true
  }
});

// ❌ Bad: N+1 queries
const podcast = await getPodcastById(id);
const episodes = await getEpisodesByPodcastId(id);
const config = await getConfigByPodcastId(id);
```

### על TypeScript
```typescript
// ✅ Always specify return types
export async function getPodcast(id: string): Promise<Podcast | null> {
  // ...
}

// ❌ Let TypeScript infer (harder to read)
export async function getPodcast(id: string) {
  // ...
}
```

### על JSDoc
```typescript
/**
 * Get podcast by ID
 *
 * @param id - The podcast ID (UUID)
 * @returns The podcast if found, null otherwise
 * @throws {Error} If database connection fails
 *
 * @example
 * ```typescript
 * const podcast = await getPodcastById('123-456');
 * if (podcast) {
 *   console.log(podcast.title);
 * }
 * ```
 */
export async function getPodcastById(id: string): Promise<Podcast | null> {
  // ...
}
```

---

## ⚠️ סיכונים ואזהרות

### Breaking Changes
- שים לב ל-re-exports - הם חייבים לשמור על ה-API הקיים
- אל תשנה signatures של functions
- אל תשנה return types

### Performance
- וודא ש-queries לא הופכים לאיטיים יותר
- שמור על שימוש ב-`with` ל-relations
- השתמש ב-prepared statements כשצריך

### Testing
- בדוק את כל ה-flows הקריטיים:
  - יצירת podcast חדש
  - עריכת podcast
  - מחיקת podcast
  - צפייה ברשימת podcasts
  - צפייה ב-podcast page

---

## 🚦 Next Steps

לאחר סיום משימה זו:
1. ✅ סמן משימה 2.2 כהושלמה
2. 📊 עדכן progress ב-`02_database_layer.md`
3. ➡️ המשך למשימה 2.3 (Standardize API Patterns)
4. 📝 עדכן את התיעוד אם צריך

---

**סטטוס משימה**: ✅ הושלם
**עדכון אחרון**: 2025-10-13
**Assigned To**: Claude Code
**Actual Time**: ~3 שעות
**Priority**: 🔴 גבוהה

---

## ✅ סיכום ביצוע

### מבנה סופי שנוצר
```
src/lib/db/api/podcasts/
├── index.ts (91 lines) - Re-exports with legacy support
├── types.ts (70 lines) - Type definitions
├── queries.ts (90 lines) - Basic read operations
├── mutations.ts (71 lines) - Write operations
├── episodes.ts (47 lines) - Episode-related queries
├── enrichment.ts (107 lines) - Config merging logic
├── relations.ts (111 lines) - Aggregate queries with counts
└── utils.ts (68 lines) - Helper functions
```

### שינויים מהתכנון המקורי
1. הוסף `episodes.ts` - הפרדת queries של episodes
2. הוסף `enrichment.ts` - לוגיקת מיזוג config (107 שורות)
3. `relations.ts` - התמקד ב-aggregate queries (111 שורות)
4. כל הקבצים מתחת ל-150 שורות ✅

### תוצאות
- ✅ Build עובר ללא שגיאות
- ✅ כל הקבצים < 150 שורות
- ✅ JSDoc על כל הפונקציות
- ✅ Return types מפורשים
- ✅ Backwards compatibility דרך index.ts
- ✅ הקובץ הישן בגיבוי: `podcasts.ts.backup`
