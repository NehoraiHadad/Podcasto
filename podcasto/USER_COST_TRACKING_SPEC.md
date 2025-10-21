# מסמך אפיון: מעקב עלויות ברמת משתמש

## רקע
כרגע המערכת מעקבת אחרי עלויות ברמת פודקאסט (`podcast_id`) ופרק (`episode_id`), אך אין מעקב אחרי המשתמש שיצר אותם.

## מטרה
להוסיף מעקב עלויות ברמת משתמש, כך שנוכל:
1. לדעת כמה כל משתמש הוציא
2. להציג למשתמש את העלויות שלו
3. להגביל משתמשים לפי budget
4. לחייב משתמשים

---

## 1. שינויי Database Schema

### 1.1 טבלת `podcasts`
**קובץ:** `src/lib/db/schema/podcasts.ts`

**שינוי:**
```typescript
// הוסף שדה:
created_by: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
```

**הסבר:**
- שדה אופציונלי (nullable) לתמיכה ב-podcasts legacy
- `onDelete: 'set null'` - אם משתמש נמחק, הפודקאסטים שלו נשארים אבל ללא בעלים

---

### 1.2 טבלת `episodes`
**קובץ:** `src/lib/db/schema/episodes.ts`

**שינוי:**
```typescript
// הוסף שדה:
created_by: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
```

**הסבר:**
- גם episodes צריכים ownership ישיר (לא רק דרך podcast)
- מאפשר scenarios שבהם פרק נוצר על ידי משתמש אחר מהפודקאסט

---

### 1.3 טבלת `cost_tracking_events`
**קובץ:** `src/lib/db/schema/cost-tracking-events.ts`

**שינויים:**
```typescript
// הוסף שדה:
user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),

// הוסף index:
userIdx: index('cost_tracking_events_user_idx').on(table.user_id)
```

**הסבר:**
- `user_id` - המשתמש שהוציא את העלות
- `onDelete: 'cascade'` - אם משתמש נמחק, גם העלויות שלו נמחקות
- Index - לביצועים בשאילתות לפי משתמש

---

### 1.4 טבלת `user_costs` (חדשה)
**קובץ:** `src/lib/db/schema/user-costs.ts` (קובץ חדש)

**תוכן:**
```typescript
import { pgTable, uuid, numeric, integer, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

/**
 * Aggregated costs per user
 * Provides quick access to total costs and breakdowns for each user
 */
export const userCosts = pgTable(
  'user_costs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .references(() => profiles.id, { onDelete: 'cascade' })
      .notNull(),

    // Cost breakdown by service category
    ai_text_cost_usd: numeric('ai_text_cost_usd').notNull().default('0'),
    ai_image_cost_usd: numeric('ai_image_cost_usd').notNull().default('0'),
    ai_tts_cost_usd: numeric('ai_tts_cost_usd').notNull().default('0'),
    lambda_execution_cost_usd: numeric('lambda_execution_cost_usd').notNull().default('0'),
    s3_operations_cost_usd: numeric('s3_operations_cost_usd').notNull().default('0'),
    s3_storage_cost_usd: numeric('s3_storage_cost_usd').notNull().default('0'),
    email_cost_usd: numeric('email_cost_usd').notNull().default('0'),
    sqs_cost_usd: numeric('sqs_cost_usd').notNull().default('0'),
    other_cost_usd: numeric('other_cost_usd').notNull().default('0'),
    total_cost_usd: numeric('total_cost_usd').notNull().default('0'),

    // Usage metrics
    total_tokens: integer('total_tokens').notNull().default(0),
    total_emails_sent: integer('total_emails_sent').notNull().default(0),
    total_s3_operations: integer('total_s3_operations').notNull().default(0),
    storage_mb: numeric('storage_mb').notNull().default('0'),
    lambda_duration_seconds: numeric('lambda_duration_seconds').notNull().default('0'),

    // Tracking timestamps
    cost_calculated_at: timestamp('cost_calculated_at', { withTimezone: true }),
    last_updated: timestamp('last_updated', { withTimezone: true }).notNull().defaultNow(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userUnique: unique('user_costs_user_unique').on(table.user_id),
    userIdx: index('user_costs_user_idx').on(table.user_id),
    totalCostIdx: index('user_costs_total_cost_idx').on(table.total_cost_usd)
  })
);
```

---

### 1.5 Export מ-index
**קובץ:** `src/lib/db/schema/index.ts`

**הוסף:**
```typescript
export * from './user-costs';
```

---

## 2. Migrations

### 2.1 Migration 1: הוספת created_by ל-podcasts ו-episodes
**קובץ:** `drizzle/0XXX_add_user_ownership.sql`

```sql
-- Add created_by to podcasts
ALTER TABLE "podcasts" ADD COLUMN "created_by" uuid;
ALTER TABLE "podcasts" ADD CONSTRAINT "podcasts_created_by_profiles_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE set null;

-- Add created_by to episodes
ALTER TABLE "episodes" ADD COLUMN "created_by" uuid;
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_created_by_profiles_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE set null;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "podcasts_created_by_idx" ON "podcasts" ("created_by");
CREATE INDEX IF NOT EXISTS "episodes_created_by_idx" ON "episodes" ("created_by");
```

---

### 2.2 Migration 2: הוספת user_id ל-cost_tracking_events
**קובץ:** `drizzle/0XXX_add_user_to_cost_tracking.sql`

```sql
-- Add user_id to cost_tracking_events
ALTER TABLE "cost_tracking_events" ADD COLUMN "user_id" uuid;
ALTER TABLE "cost_tracking_events" ADD CONSTRAINT "cost_tracking_events_user_id_profiles_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade;

-- Add index for performance
CREATE INDEX IF NOT EXISTS "cost_tracking_events_user_idx" ON "cost_tracking_events" ("user_id");
```

---

### 2.3 Migration 3: יצירת טבלת user_costs
**קובץ:** `drizzle/0XXX_create_user_costs_table.sql`

```sql
CREATE TABLE IF NOT EXISTS "user_costs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "ai_text_cost_usd" numeric DEFAULT '0' NOT NULL,
  "ai_image_cost_usd" numeric DEFAULT '0' NOT NULL,
  "ai_tts_cost_usd" numeric DEFAULT '0' NOT NULL,
  "lambda_execution_cost_usd" numeric DEFAULT '0' NOT NULL,
  "s3_operations_cost_usd" numeric DEFAULT '0' NOT NULL,
  "s3_storage_cost_usd" numeric DEFAULT '0' NOT NULL,
  "email_cost_usd" numeric DEFAULT '0' NOT NULL,
  "sqs_cost_usd" numeric DEFAULT '0' NOT NULL,
  "other_cost_usd" numeric DEFAULT '0' NOT NULL,
  "total_cost_usd" numeric DEFAULT '0' NOT NULL,
  "total_tokens" integer DEFAULT 0 NOT NULL,
  "total_emails_sent" integer DEFAULT 0 NOT NULL,
  "total_s3_operations" integer DEFAULT 0 NOT NULL,
  "storage_mb" numeric DEFAULT '0' NOT NULL,
  "lambda_duration_seconds" numeric DEFAULT '0' NOT NULL,
  "cost_calculated_at" timestamp with time zone,
  "last_updated" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "user_costs_user_unique" UNIQUE("user_id"),
  CONSTRAINT "user_costs_user_id_profiles_id_fk" FOREIGN KEY ("user_id")
    REFERENCES "profiles"("id") ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "user_costs_user_idx" ON "user_costs" ("user_id");
CREATE INDEX IF NOT EXISTS "user_costs_total_cost_idx" ON "user_costs" ("total_cost_usd");
```

---

## 3. עדכון Cost Tracker Service

### 3.1 קובץ: `src/lib/services/cost-tracker.ts`

**שינויים נדרשים:**

1. **הוסף `userId` לפרמטרים:**
```typescript
export async function trackCostEvent(params: {
  episodeId?: string;
  podcastId?: string;
  userId?: string;  // NEW
  eventType: string;
  service: string;
  quantity: number;
  unit: string;
  metadata?: Record<string, unknown>;
}): Promise<void>
```

2. **שמור `user_id` בדטהבייס:**
```typescript
await db.insert(costTrackingEvents).values({
  episode_id: params.episodeId,
  podcast_id: params.podcastId,
  user_id: params.userId,  // NEW
  event_type: params.eventType,
  service: params.service,
  // ... rest
});
```

---

## 4. עדכון כל הקריאות ל-trackCostEvent

### קבצים שצריך לעדכן (11 קבצים):

#### 4.1 `src/lib/ai/providers/gemini.ts`
**לפני:**
```typescript
await trackCostEvent({
  episodeId,
  podcastId,
  eventType: 'ai_api_call',
  // ...
});
```

**אחרי:**
```typescript
await trackCostEvent({
  episodeId,
  podcastId,
  userId,  // NEW - צריך להעביר מהקורא
  eventType: 'ai_api_call',
  // ...
});
```

**רשימת קבצים:**
1. `src/lib/ai/providers/gemini.ts`
2. `src/lib/ai/providers/gemini-text-generation.ts`
3. `src/lib/ai/providers/image-generator.ts`
4. `src/lib/services/podcast-image-analyzer.ts`
5. `src/lib/services/podcast-image-enhancer.ts`
6. `src/lib/services/podcast-image-enhancer-multi.ts`
7. `src/lib/services/email/batch-sender.ts`
8. `src/lib/services/s3-service.ts` (4 מיקומים)
9. `src/lib/services/s3-service-bulk-operations.ts`

**אסטרטגיה:**
- כל פונקציה שקוראת ל-`trackCostEvent` צריכה לקבל `userId` בפרמטרים
- צריך להעביר את ה-`userId` דרך כל השרשרת עד למקור (server action)

---

## 5. קבלת userId ב-Server Actions

### 5.1 איפה לקבל את ה-userId?

בכל server action, נשתמש ב-Supabase Auth:

```typescript
import { createClient } from '@/lib/supabase/server';

export async function someAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userId = user?.id;  // זה ה-userId שנעביר הלאה

  // המשך הפעולה...
}
```

---

### 5.2 קבצים שצריך לעדכן:

#### Podcast Creation
- `src/lib/actions/podcast/create.ts`
- `src/lib/actions/podcast/image/generate-from-telegram.ts`
- `src/lib/actions/podcast/image/generate-from-url.ts`
- `src/lib/actions/podcast/image/generate-from-file.ts`

#### Episode Creation/Processing
- `src/lib/actions/episode/image/generate-image.ts`
- `src/lib/actions/episode/image/generate-preview.ts`
- `src/lib/services/post-processing.ts`

---

## 6. עדכון יצירת Podcasts ו-Episodes

### 6.1 `src/lib/actions/podcast/create.ts`

**שינויים:**
1. קבל את ה-userId מ-Supabase Auth
2. שמור `created_by` ב-podcast record:
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

await db.insert(podcasts).values({
  title,
  description,
  created_by: user?.id,  // NEW
  // ... rest
});
```

---

### 6.2 יצירת Episodes
**קובץ:** איפה ש-episodes נוצרים (צריך לזהות)

**שינוי:**
```typescript
await db.insert(episodes).values({
  podcast_id,
  title,
  created_by: user?.id,  // NEW
  // ... rest
});
```

---

## 7. Services - העברת userId

### 7.1 שרשרת העברה דוגמה:

```
Server Action (has userId)
  ↓
Post Processing Service (needs to accept userId)
  ↓
AI Service (needs to accept userId)
  ↓
trackCostEvent (saves userId)
```

### 7.2 קבצים לעדכן:

1. **`src/lib/services/post-processing.ts`**
   - `processCompletedEpisode()` - קבל userId
   - העבר ל-`aiService.generateTitleAndSummary()`

2. **`src/lib/ai/index.ts` (AIService class)**
   - `generateTitleAndSummary()` - קבל userId
   - `generateText()` - קבל userId
   - העבר ל-providers

3. **`src/lib/services/image-generation.ts`**
   - `generateImagePreview()` - קבל userId

---

## 8. Server Actions חדשים לעלויות משתמש

### 8.1 `src/lib/actions/cost/get-user-cost.ts` (חדש)

```typescript
'use server';

import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { userCosts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getUserCost(userId?: string) {
  const authUserId = await requireAuth();

  // אם לא הועבר userId, השתמש במשתמש המחובר
  const targetUserId = userId || authUserId;

  const [userCost] = await db
    .select()
    .from(userCosts)
    .where(eq(userCosts.user_id, targetUserId))
    .limit(1);

  return userCost || null;
}
```

---

### 8.2 `src/lib/actions/cost/calculate-user-cost.ts` (חדש)

```typescript
'use server';

import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { userCosts, costTrackingEvents } from '@/lib/db/schema';
import { eq, sum, count, sql } from 'drizzle-orm';

export async function calculateUserCost(userId: string) {
  await requireAdmin();

  // חשב סכומים מ-cost_tracking_events
  const [aggregation] = await db
    .select({
      totalCost: sum(costTrackingEvents.total_cost_usd),
      aiTextCost: sum(
        sql`CASE WHEN ${costTrackingEvents.service} IN ('gemini_text')
            THEN ${costTrackingEvents.total_cost_usd} ELSE 0 END`
      ),
      // ... עוד breakdowns
    })
    .from(costTrackingEvents)
    .where(eq(costTrackingEvents.user_id, userId));

  // Insert או Update ב-user_costs
  await db
    .insert(userCosts)
    .values({
      user_id: userId,
      total_cost_usd: aggregation.totalCost || '0',
      ai_text_cost_usd: aggregation.aiTextCost || '0',
      // ... rest
      cost_calculated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: userCosts.user_id,
      set: {
        total_cost_usd: aggregation.totalCost || '0',
        // ... rest
        last_updated: new Date(),
      },
    });
}
```

---

## 9. UI - Dashboard למשתמש

### 9.1 `/profile/costs` (דף חדש)

מיקום: `src/app/profile/costs/page.tsx`

**תכונות:**
- הצגת העלויות של המשתמש
- פירוט לפי סוג (AI Text, AI Image, etc.)
- גרפים לאורך זמן
- רשימת הפודקאסטים והפרקים שלו עם עלויות

---

### 9.2 `/admin/costs` - טאב Users

**הוסף טאב רביעי:**
- רשימת משתמשים
- עלויות לכל משתמש
- מיון לפי הוצאה
- אפשרות לקבוע limits

---

## 10. סדר ביצוע מומלץ

1. ✅ **Schema Changes** (כבר התחלנו)
   - [ ] `podcasts.ts` - הוסף `created_by`
   - [ ] `episodes.ts` - הוסף `created_by`
   - [ ] `cost-tracking-events.ts` - הוסף `user_id`
   - [ ] `user-costs.ts` - צור טבלה חדשה

2. **Migrations**
   - [ ] Generate migrations: `npx drizzle-kit generate`
   - [ ] Apply to dev: `npx drizzle-kit push`

3. **Cost Tracker Service**
   - [ ] עדכן `cost-tracker.ts` לקבל `userId`

4. **עדכון Services Layer**
   - [ ] AI providers
   - [ ] Image services
   - [ ] Post-processing
   - [ ] S3 services
   - [ ] Email services

5. **עדכון Server Actions**
   - [ ] Podcast creation
   - [ ] Episode creation
   - [ ] Cost actions חדשים

6. **UI**
   - [ ] `/profile/costs` page
   - [ ] Admin dashboard tab

7. **Testing**
   - [ ] TypeScript check
   - [ ] Build
   - [ ] Manual testing

---

## 11. Backward Compatibility

### 11.1 נתונים קיימים
- כל ה-podcasts/episodes/costs הקיימים יצטרכו לקבל `created_by`
- **כל הפודקאסטים עד עכשיו יוצרו על ידי המנהל: nehorai**
- צריך data migration script שימצא את ה-user_id של nehorai וישים בכל הרשומות

### 11.2 קריאות ללא userId
- אם `userId` לא מועבר ל-`trackCostEvent`, פשוט נשמור `null`
- זה לא ישבור שום דבר קיים

---

## 12. Performance Considerations

### Indexes
כל ה-indexes הנדרשים מוגדרים ב-schemas:
- `podcasts.created_by`
- `episodes.created_by`
- `cost_tracking_events.user_id`
- `user_costs.user_id`

### Caching
- שקול cache ל-`user_costs` (מחושב לא בזמן אמת)
- Revalidate כל 5 דקות או בעת חישוב מחדש

---

## סיכום

שינוי זה יאפשר:
1. ✅ מעקב עלויות מלא ברמת משתמש
2. ✅ Dashboard אישי לכל משתמש
3. ✅ חיוב לפי שימוש
4. ✅ הגבלות budget
5. ✅ דוחות מנהלים ברמת משתמש

**Next Step:** שלח ל-subagents לביצוע שלב אחרי שלב
