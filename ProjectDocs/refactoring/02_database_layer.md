# 🗄️ תחום 2: Database Layer (Drizzle ORM + Schema)

## תאריך יצירה: 2025-10-13
## Phase: 1 (Foundation) ⭐ **התחל כאן**
## תלויות: אין - זה ה-foundation!

---

## 📊 מצב נוכחי

### Schema Files

| קובץ | שורות | בעיות מזוהות |
|------|-------|---------------|
| `src/lib/db/schema/podcasts.ts` | 19 | ✅ קטן וממוקד |
| `src/lib/db/schema/episodes.ts` | 30 | ✅ טוב |
| `src/lib/db/schema/podcast-configs.ts` | 46 | ✅ סביר |
| `src/lib/db/schema/subscriptions.ts` | 25 | ✅ טוב |
| `src/lib/db/schema/sent-episodes.ts` | 25 | ✅ טוב |
| `src/lib/db/schema/user-roles.ts` | 11 | ✅ מינימלי |
| `src/lib/db/schema/profiles.ts` | 17 | ✅ טוב |
| `src/lib/db/schema/relations.ts` | 46 | ⚠️ כל ה-relations במקום אחד |
| `src/lib/db/schema/index.ts` | 20 | ✅ export file |

### API Files

| קובץ | שורות | בעיות מזוהות |
|------|-------|---------------|
| `src/lib/db/api/podcasts.ts` | 245 | ⚠️ גדול - צריך לפצל |
| `src/lib/db/api/episodes.ts` | 87 | ✅ סביר |
| `src/lib/db/api/podcast-configs.ts` | 77 | ✅ סביר |
| `src/lib/db/api/subscriptions.ts` | 66 | ✅ סביר |
| `src/lib/db/api/sent-episodes.ts` | 78 | ✅ סביר |
| `src/lib/db/api/user-roles.ts` | 56 | ✅ סביר |
| `src/lib/db/api/profiles.ts` | 77 | ✅ סביר |
| `src/lib/db/api/index.ts` | 26 | ✅ export file |

### בעיות מזוהות

1. **Schema Organization**
   - Relations מרוכזים במקום אחד (טוב!)
   - אבל חסר documentation על הקשרים

2. **API Layer - Inconsistency**
   - `podcasts.ts` גדול מדי (245 שורות)
   - חסר consistent naming convention
   - חסר error handling אחיד

3. **Type Safety**
   - `types.ts` בגודל 520 שורות - צריך לפצל
   - חסרים utility types מסוימים

4. **Migrations**
   - לא ברור אם יש migration convention
   - חסר תיעוד על workflow

5. **N+1 Queries Risk**
   - לא משתמשים ב-`with` של Drizzle בכל מקום
   - יש מקומות עם sequential queries

---

## 🎯 מטרות שיפור

### מטרה 1: Optimize Schema Organization
✅ תיעוד relations
✅ עקביות בהגדרות
✅ Migration best practices

### מטרה 2: Standardize API Layer
✅ פיצול podcasts.ts
✅ Naming conventions
✅ Error handling patterns

### מטרה 3: Improve Type System
✅ פיצול types.ts
✅ Domain-specific types
✅ Utility types

### מטרה 4: Query Optimization
✅ Eliminate N+1 queries
✅ Use Drizzle `with` properly
✅ Add query documentation

---

## 📚 דוקומנטציה רלוונטית

### Drizzle ORM (2025)

**Best Practices Guide**
- https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717
- ⚡ **NEW 2025**: Use `generatedAlwaysAsIdentity()` instead of `serial`
- Identity columns for PostgreSQL
- Reusable column patterns

**Relational Queries**
- https://orm.drizzle.team/docs/rqb
- Key principle: "Drizzle relational queries always generate exactly one SQL statement"
- Use `with` to avoid N+1 queries
- Nested relation fetching

**Query Patterns**
- https://orm.drizzle.team/docs/select
- Drizzle explicitly lists columns (good practice)
- Prepared statements for performance
- Partial field selection

**Common Mistakes to Avoid (Feb 2025)**
- https://medium.com/@lior_amsalem/3-biggest-mistakes-with-drizzle-orm-1327e2531aff
1. Managing migrations improperly
2. Not optimizing queries (select only needed fields)
3. Defining relationships incorrectly

### PostgreSQL Best Practices

**Identity Columns (2025 Standard)**
```typescript
// ❌ Old way (serial)
id: serial('id').primaryKey()

// ✅ New way (identity)
id: integer('id').primaryKey().generatedAlwaysAsIdentity()
```

**Timestamps**
```typescript
created_at: timestamp('created_at').defaultNow().notNull()
updated_at: timestamp('updated_at').defaultNow().notNull()
```

### Schema Design Patterns

**Naming Conventions**
- Tables: plural, snake_case (`user_roles`, `sent_episodes`)
- Columns: snake_case (`cover_image`, `telegram_channel`)
- Relations: descriptive names (`podcastSubscriptions`, `episodeSent`)

**Indexes**
- Add indexes for foreign keys
- Add indexes for commonly queried columns
- Use composite indexes wisely

---

## 📝 משימות מפורטות

### משימה 2.1: Document Schema Relations
**קובץ**: `tasks/02_schema_documentation.md`
**עדיפות**: 🟡 בינונית
**זמן משוער**: 1-2 שעות

**תיאור קצר:**
הוספת תיעוד מפורט על הקשרים בין הטבלאות

**קבצים לעדכן:**
- `src/lib/db/schema/relations.ts`
- יצירת `SCHEMA.md` documentation file

**[📄 קישור למשימה מפורטת](./tasks/02_schema_documentation.md)**

---

### משימה 2.2: Split Podcasts API
**קובץ**: `tasks/02_split_podcasts_api.md`
**עדיפות**: 🔴 גבוהה
**זמן משוער**: 3-4 שעות

**תיאור קצר:**
פיצול `podcasts.ts` (245 שורות) למודולים קטנים יותר

**מבנה מוצע:**
```
src/lib/db/api/podcasts/
├── index.ts           (re-exports)
├── queries.ts         (read operations)
├── mutations.ts       (create/update/delete)
├── relations.ts       (podcast with episodes, etc.)
└── utils.ts           (helper functions)
```

**[📄 קישור למשימה מפורטת](./tasks/02_split_podcasts_api.md)**

---

### משימה 2.3: Standardize API Patterns
**קובץ**: `tasks/02_api_patterns.md`
**עדיפות**: 🔴 גבוהה
**זמן משוער**: 3 שעות

**תיאור קצר:**
יצירת conventions אחידים לכל ה-API functions

**דפוסים לאחד:**
- Naming: `get*`, `create*`, `update*`, `delete*`, `list*`
- Error handling: consistent return types
- Query structure: always use typed queries

**קבצים חדשים:**
- `src/lib/db/api/base-api.ts` (shared utilities)
- `src/lib/db/api/types.ts` (shared types)

**[📄 קישור למשימה מפורטת](./tasks/02_api_patterns.md)**

---

### משימה 2.4: Optimize Queries (N+1)
**קובץ**: `tasks/02_query_optimization.md`
**עדיפות**: 🟡 בינונית
**זמן משוער**: 4-5 שעות

**תיאור קצר:**
מציאת ותיקון N+1 queries, שימוש ב-`with` של Drizzle

**דוגמה לבעיה:**
```typescript
// ❌ N+1 Query
const podcasts = await db.select().from(podcasts);
for (const podcast of podcasts) {
  const episodes = await db.select()
    .from(episodes)
    .where(eq(episodes.podcast_id, podcast.id));
}

// ✅ Single Query with Drizzle
const podcasts = await db.query.podcasts.findMany({
  with: {
    episodes: true
  }
});
```

**[📄 קישור למשימה מפורטת](./tasks/02_query_optimization.md)**

---

## 🔗 תלויות

### Incoming Dependencies (מה תלוי בנו)
- ✅ **כל התחומים האחרים** - זה ה-foundation!
- Server Actions (03)
- Services (04)
- Authentication (01)
- UI Components (05)

### Outgoing Dependencies (על מה אנחנו תלויים)
- אין! זה התחום הראשון לעבוד עליו

---

## ✅ Checklist ביצוע

### Pre-Work
- [ ] קרא את Drizzle ORM best practices (2025)
- [ ] הבן את ההבדל בין `serial` ל-`generatedAlwaysAsIdentity`
- [ ] סקור את המבנה הנוכחי של כל הטבלאות
- [ ] בדוק אילו queries כרגע רצים (performance monitoring)

### During Work
- [ ] עבוד לפי סדר: 2.1 → 2.2 → 2.3 → 2.4
- [ ] אל תשבור קוד קיים - עבוד בצורה הדרגתית
- [ ] כתוב migration scripts לכל שינוי schema
- [ ] תיעד כל API function עם JSDoc

### Post-Work
- [ ] הרץ `npx drizzle-kit check`
- [ ] הרץ `npx drizzle-kit generate` (if schema changed)
- [ ] בדוק שכל ה-queries עובדים
- [ ] הרץ `npm run typecheck`
- [ ] הרץ `npm run build`

---

## 🎯 קריטריונים להצלחה

### Schema Quality
- [ ] כל schema file < 100 שורות
- [ ] יש תיעוד לכל relation
- [ ] עקביות בשימוש ב-types (identity vs serial)
- [ ] Indexes מוגדרים נכון

### API Quality
- [ ] כל API file < 150 שורות
- [ ] Naming convention אחיד
- [ ] Error handling consistent
- [ ] JSDoc על כל function ציבורית

### Query Performance
- [ ] אין N+1 queries
- [ ] שימוש ב-`with` כשצריך relations
- [ ] Select רק fields נדרשים
- [ ] Prepared statements כשרלוונטי

### Type Safety
- [ ] אין any types
- [ ] Return types מוגדרים
- [ ] Input validation עם Zod (אם רלוונטי)
- [ ] Inferred types מ-Drizzle

---

## 📊 מדדי התקדמות

### משימה 2.1: Schema Documentation
Status: ⬜ לא התחיל
Progress: ⬜⬜⬜⬜⬜ 0%

### משימה 2.2: Split Podcasts API
Status: ⬜ לא התחיל
Progress: ⬜⬜⬜⬜⬜ 0%

### משימה 2.3: Standardize API Patterns
Status: ⬜ לא התחיל
Progress: ⬜⬜⬜⬜⬜ 0%

### משימה 2.4: Optimize Queries
Status: ⬜ לא התחיל
Progress: ⬜⬜⬜⬜⬜ 0%

**התקדמות תחום: 0/4 משימות (0%)**

---

## 🚦 Next Steps

1. **התחל כאן!** זה ה-foundation - הכי חשוב
2. קרא את הדוקומנטציה של Drizzle ORM 2025
3. התחל עם משימה 2.1 (תיעוד)
4. המשך למשימות 2.2-2.4 לפי הסדר

---

## 📝 הערות וטיפים

### על Drizzle Migrations
```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Apply migrations
npm run db:push # or your custom command
```

### על Identity Columns (2025)
```typescript
// מומלץ לעבור מ-serial ל-identity בהדרגה
// לא חובה לשנות בקוד קיים, רק בטבלאות חדשות

id: integer('id')
  .primaryKey()
  .generatedAlwaysAsIdentity({
    startWith: 1,
    increment: 1
  })
```

### על Query Optimization
```typescript
// דוגמה טובה: podcast עם episodes ו-config
const podcast = await db.query.podcasts.findFirst({
  where: eq(podcasts.id, podcastId),
  with: {
    episodes: {
      limit: 10,
      orderBy: desc(episodes.published_at)
    },
    config: true
  }
});
// זה יוצר SQL query אחד בלבד!
```

### על Type Safety
```typescript
// השתמש ב-InferSelectModel ו-InferInsertModel
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type Podcast = InferSelectModel<typeof podcasts>;
export type NewPodcast = InferInsertModel<typeof podcasts>;
```

---

## ⚠️ אזהרות

### Migration Safety
- **תמיד** בדוק migration לפני production
- אל תמחק columns במכה אחת - עשה זאת בשלבים
- שמור backup לפני migrations גדולים

### Performance
- אל תטען relations שלא צריך
- השתמש ב-`limit` לרשימות ארוכות
- שקול pagination למידע רב

### Breaking Changes
- שינויי schema יכולים לשבור קוד קיים
- עדכן קודם את האפליקציה, אחר כך את הסכמה
- תכנן backwards compatibility

---

**סטטוס תחום**: 🔴 לא התחיל
**עדכון אחרון**: 2025-10-13
**בעלים**: Development Team
**קריטיות**: ⭐⭐⭐ מאוד גבוהה - זה ה-foundation!
