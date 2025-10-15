# Task 1.1: Database Layer Optimization

**Phase:** 1 - Core Infrastructure
**משך משוער:** 1-1.5 ימים
**עדיפות:** 🔴 Critical
**Status:** 📝 Planning

---

## 🎯 מטרה

אופטימיזציה של שכבת הDatabase באמצעות Drizzle ORM, עם דגש על:
- יישום Identity Columns (PostgreSQL 2025 standard)
- פיצול קבצים גדולים
- שיפור queries ו-relations
- Type safety improvements

---

## 📚 דוקומנטציה רלוונטית

### Drizzle ORM (2025)
- **Best Practices:** https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717
- **Identity Columns:** https://orm.drizzle.team/docs/column-types/pg#integer
- **Relations:** https://orm.drizzle.team/docs/rqb#select-with-relations
- **Transactions:** https://orm.drizzle.team/docs/transactions

### Key Changes 2025:
```typescript
// ❌ OLD: Serial (deprecated by PostgreSQL)
id: serial('id').primaryKey()

// ✅ NEW: Identity Columns
id: integer('id')
  .generatedAlwaysAsIdentity({
    startWith: 1,
    increment: 1,
    cache: 1
  })
  .primaryKey()
```

### Type Safety with Drizzle
```typescript
// ✅ Infer types from schema
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type Podcast = InferSelectModel<typeof podcasts>;
export type NewPodcast = InferInsertModel<typeof podcasts>;
```

---

## 📋 מצב נוכחי

### קבצים גדולים שדורשים פיצול:
1. **src/lib/db/api/episodes.ts** - 226 שורות
   - Queries, mutations, relations מעורבבים
   - חסר separation of concerns

2. **src/lib/db/api/profiles.ts** - 208 שורות
   - יותר מדי logic בקובץ אחד

3. **src/lib/db/api/sent-episodes.ts** - 184 שורות
   - ניתן לפשט ולארגן מחדש

### Schema Files:
- **src/lib/db/schema/** - בדיקת Serial vs Identity
- לא כל הטבלאות משתמשות ב-Identity Columns

### Structure Example (Good):
```
src/lib/db/api/podcasts/
├── index.ts                  ✅ Clean exports
├── types.ts                  ✅ Type definitions
├── queries.ts                ✅ SELECT operations
├── mutations.ts              ✅ INSERT/UPDATE/DELETE
├── episodes.ts               ✅ Episode-related
├── enrichment.ts             ✅ Data enrichment
├── relations.ts              ✅ Complex joins
└── utils.ts                  ✅ Helper functions
```

---

## 🎯 מצב רצוי

### Structure for All API Modules:
```
src/lib/db/api/{entity}/
├── index.ts              # Clean exports + legacy support
├── types.ts              # Type definitions
├── queries.ts            # SELECT (read operations)
├── mutations.ts          # INSERT/UPDATE/DELETE
├── relations.ts          # Complex queries with joins
├── utils.ts              # Helper functions
└── README.md (optional)  # Usage examples
```

### Schema Improvements:
1. כל הטבלאות עם `generatedAlwaysAsIdentity()`
2. Reusable timestamp patterns
3. Type-safe enums
4. Proper foreign key constraints

### Query Patterns:
```typescript
// ✅ Use prepare() for repeated queries
const getPodcastById = db
  .select()
  .from(podcasts)
  .where(eq(podcasts.id, placeholder('id')))
  .prepare('get_podcast_by_id');

// ✅ Type-safe queries
const result = await getPodcastById.execute({ id: podcastId });
```

---

## 📂 קבצים מעורבים

### Priority 1 - Must Refactor:
```
src/lib/db/api/
├── episodes.ts                    → episodes/
│   ├── index.ts
│   ├── types.ts
│   ├── queries.ts
│   ├── mutations.ts
│   ├── relations.ts
│   └── utils.ts
│
├── profiles.ts                    → profiles/
│   ├── index.ts
│   ├── types.ts
│   ├── queries.ts
│   ├── mutations.ts
│   └── utils.ts
│
└── sent-episodes.ts               → sent-episodes/
    ├── index.ts
    ├── types.ts
    ├── queries.ts
    ├── mutations.ts
    └── utils.ts
```

### Priority 2 - Review & Optimize:
```
src/lib/db/api/
├── podcast-configs.ts (187 שורות)  → optimize
├── subscriptions.ts                → optimize
├── user-roles.ts                   → optimize
└── podcasts/
    └── relations.ts                → review queries
```

### Priority 3 - Schema Updates:
```
src/lib/db/schema/
├── podcasts.ts                     → check identity columns
├── episodes.ts                     → check identity columns
├── subscriptions.ts                → check identity columns
├── sent-episodes.ts                → check identity columns
├── user-roles.ts                   → check identity columns
├── podcast-configs.ts              → check identity columns
├── profiles.ts                     → check identity columns
└── relations.ts                    → review
```

---

## 🔧 שלבי ביצוע

### Step 1: Schema Updates (0.5 יום)
- [ ] סקירת כל schema files
- [ ] זיהוי Serial columns
- [ ] המרה ל-Identity Columns
- [ ] Generate migration: `npx drizzle-kit generate`
- [ ] Review migration SQL
- [ ] Apply migration (on dev DB)
- [ ] Test schema changes

#### Example Migration:
```sql
-- Before
CREATE TABLE podcasts (
  id SERIAL PRIMARY KEY,
  ...
);

-- After
CREATE TABLE podcasts (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ...
);
```

### Step 2: Refactor episodes.ts (0.3 יום)
- [ ] יצירת `src/lib/db/api/episodes/` directory
- [ ] פיצול ל-6 קבצים (types, queries, mutations, relations, utils, index)
- [ ] העברת קוד לקבצים המתאימים
- [ ] Type safety improvements
- [ ] Update imports ב-dependent files
- [ ] Test all episode operations

#### File Breakdown:
```typescript
// types.ts
export type Episode = InferSelectModel<typeof episodes>;
export type NewEpisode = InferInsertModel<typeof episodes>;
export type EpisodeQueryOptions = { ... };

// queries.ts - Read operations
export const getEpisodeById = async (id: string) => { ... };
export const getAllEpisodes = async (options?: EpisodeQueryOptions) => { ... };

// mutations.ts - Write operations
export const createEpisode = async (data: NewEpisode) => { ... };
export const updateEpisode = async (id: string, data: Partial<Episode>) => { ... };

// relations.ts - Complex queries
export const getEpisodeWithPodcast = async (id: string) => { ... };
```

### Step 3: Refactor profiles.ts (0.2 יום)
- [ ] יצירת `src/lib/db/api/profiles/` directory
- [ ] פיצול לפי הדפוס של podcasts
- [ ] Type improvements
- [ ] Update imports
- [ ] Test

### Step 4: Refactor sent-episodes.ts (0.2 יום)
- [ ] יצירת `src/lib/db/api/sent-episodes/` directory
- [ ] פיצול לפי הדפוס
- [ ] Optimize email tracking queries
- [ ] Update imports
- [ ] Test

### Step 5: Optimize Remaining Files (0.3 יום)
- [ ] Review podcast-configs.ts - הפחתת שורות
- [ ] Review subscriptions.ts - query optimization
- [ ] Review user-roles.ts - type safety
- [ ] Review podcasts/relations.ts - performance

### Step 6: Testing & Validation (0.2 יום)
- [ ] `npm run build` - success
- [ ] Test CRUD operations for all entities
- [ ] Verify relations work
- [ ] Check TypeScript strict mode
- [ ] Performance testing (if needed)

---

## ✅ Acceptance Criteria

### Code Quality:
- [ ] כל הקבצים < 150 שורות
- [ ] אין TypeScript errors
- [ ] אין ESLint warnings
- [ ] Type safety: InferSelectModel & InferInsertModel

### Functionality:
- [ ] כל ה-CRUD operations עובדים
- [ ] Relations queries עובדים
- [ ] Transactions עובדים
- [ ] אין breaking changes

### Structure:
- [ ] Consistent file organization
- [ ] Clear exports ב-index.ts
- [ ] Legacy compatibility maintained
- [ ] JSDoc comments added

---

## 🧪 Testing Checklist

### Manual Tests:
```bash
# Episodes
- Create episode → verify DB
- Update episode → verify changes
- Delete episode → verify cascade
- Get episode with podcast → verify join

# Profiles
- Create profile → verify
- Update profile → verify
- Link to user → verify FK

# Sent Episodes
- Track email sent → verify
- Check duplicate prevention → verify
- Query by user → verify
```

### Automated Tests (if exists):
```bash
npm run test -- src/lib/db/api
```

---

## 📝 Migration Script Example

```typescript
// drizzle/0001_add_identity_columns.sql
-- Update podcasts table
ALTER TABLE podcasts DROP COLUMN id;
ALTER TABLE podcasts ADD COLUMN id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY;

-- Update episodes table
ALTER TABLE episodes DROP COLUMN id;
ALTER TABLE episodes ADD COLUMN id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY;

-- etc...
```

⚠️ **Warning:** Migration משנה PKs - צריך backup!

---

## 🚨 הערות חשובות

### Breaking Changes:
❌ **לא צפויים** - structure change רק internally

### Performance:
- Identity Columns יותר מהירים מ-Serial
- Prepared statements משפרים performance
- Relations queries - להימנע מ-N+1

### Backup Plan:
```bash
# Before migration
pg_dump podcasto_dev > backup_before_identity.sql

# If rollback needed
psql podcasto_dev < backup_before_identity.sql
```

---

## 📊 Success Metrics

### Before → After:
- **episodes.ts**: 226 שורות → 6 files × ~40 שורות
- **profiles.ts**: 208 שורות → 5 files × ~40 שורות
- **sent-episodes.ts**: 184 שורות → 5 files × ~35 שורות

### Performance:
- Query time: Similar or better
- Type safety: 100% (no `any`)
- Build time: No regression

---

## 🔗 קישורים נוספים

- [Drizzle Migrations](https://orm.drizzle.team/docs/migrations)
- [PostgreSQL Identity Columns](https://www.postgresql.org/docs/current/ddl-identity-columns.html)
- [TypeScript Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)

---

**Next Task:** [Task 1.2: Auth & Security](./task-1.2-auth-security.md)

---

**Updated:** 2025-01-15
**Status:** 📝 Planning → 🚀 Ready to Execute
