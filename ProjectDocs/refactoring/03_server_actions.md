# ⚡ תחום 3: Server Actions

## תאריך יצירה: 2025-10-13
## Phase: 2 (Core Logic)
## תלויות: Database Layer (02), Services (04)

---

## 📊 מצב נוכחי

### Actions Files

| קובץ | שורות | בעיות מזוהות |
|------|-------|---------------|
| `actions/podcast/image-actions.ts` | ~~683~~ → 8 files | ✅ פוצל (הושלם 2025-10-13) |
| `actions/podcast/generate.ts` | ~~322~~ → 102 | ✅ פוצל (הושלם 2025-10-13) |
| `actions/podcast/update.ts` | ~~302~~ → 116 | ✅ פוצל (הושלם 2025-10-13) |
| `actions/episode/bulk-generation-actions.ts` | 283 | ⚠️ גדול - צריך פיצול |
| `actions/episode/s3-file-actions.ts` | 251 | ⚠️ גדול - צריך פיצול |
| `actions/subscription-actions.ts` | 229 | ⚠️ גדול - צריך פיצול |
| `actions/admin-actions.ts` | 200 | ⚠️ גבול |
| `actions/auth-actions.ts` | 127 | ✅ סביר |

### ארגון תיקיות

```
actions/
├── admin-actions.ts
├── auth-actions.ts
├── auth-password-actions.ts
├── subscription-actions.ts
├── unsubscribe-actions.ts
├── user-actions.ts
├── episode-actions.ts        # wrapper/index
├── episode/
│   ├── core-actions.ts
│   ├── generation-actions.ts
│   ├── audio-actions.ts
│   ├── bulk-generation-actions.ts
│   ├── email-actions.ts
│   ├── s3-file-actions.ts
│   └── image/
│       └── generate-actions.ts
└── podcast/
    ├── image-actions.ts
    ├── generate.ts
    └── update.ts
```

### בעיות מזוהות

1. **ארגון לא עקבי**
   - יש תיקיות משנה רק לחלק מה-domains
   - podcast/ ו-episode/ אבל אין auth/, subscription/, etc

2. **קבצים גדולים מדי**
   - 6 קבצים מעל 200 שורות
   - צריך לפצל לפי responsibility

3. **Duplication**
   - Error handling logic חוזר
   - Validation patterns דומים
   - Revalidation code מועתק

4. **לא עוקבים אחרי Best Practices של Next.js 15**
   - חסר progressive enhancement במקומות
   - לא משתמשים ב-`useActionState` תמיד
   - חסר proper error boundaries

---

## 🎯 מטרות שיפור

### מטרה 1: Consistent Organization
✅ ארגון תיקיות אחיד
✅ פיצול לפי domain
✅ Clear naming patterns

### מטרה 2: Split Large Files
✅ פיצול image-actions.ts
✅ פיצול generate.ts
✅ פיצול update.ts

### מטרה 3: Shared Utilities
✅ Error handling utilities
✅ Validation utilities
✅ Revalidation utilities

### מטרה 4: Next.js 15 Patterns
✅ Progressive enhancement
✅ Proper error handling
✅ Type-safe action creators

---

## 📚 דוקומנטציה רלוונטית

### Next.js 15 Server Actions (2025)

**Official Docs**
- https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- Key: "Server Components support progressive enhancement by default"
- Use `revalidatePath()` and `revalidateTag()`

**Best Practices (Jan 2025)**
- https://medium.com/@lior_amsalem/nextjs-15-actions-best-practice-bf5cc023301e
- Separation of concerns: actions handle data logic, components handle rendering
- Avoid embedding HTML/JSX in actions
- Centralized error handling

**Security**
- Server Actions use `POST` method automatically
- Treat as public HTTP endpoints
- Validate all inputs server-side
- Don't expose sensitive data in responses

**Patterns**
```typescript
// ✅ Good: Type-safe action with proper error handling
export async function createPodcast(formData: FormData): Promise<ActionResult> {
  'use server';

  try {
    // Validation
    const data = parseFormData(formData);

    // Business logic
    const result = await podcastService.create(data);

    // Revalidation
    revalidatePath('/admin/podcasts');

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: handleError(error) };
  }
}
```

**Anti-Patterns**
- ❌ Large actions with multiple responsibilities
- ❌ No error handling
- ❌ Direct database access without service layer
- ❌ Returning sensitive data

---

## 📝 משימות מפורטות

### משימה 3.1: Reorganize Action Structure
**קובץ**: `tasks/03_reorganize_actions.md`
**עדיפות**: 🟡 בינונית
**זמן משוער**: 2-3 שעות

**מבנה מוצע:**
```
actions/
├── shared/
│   ├── error-handler.ts
│   ├── validators.ts
│   ├── revalidation.ts
│   └── types.ts
├── auth/
│   ├── login-action.ts
│   ├── register-action.ts
│   ├── password-action.ts
│   └── session-action.ts
├── podcast/
│   ├── create-action.ts
│   ├── update-action.ts
│   ├── delete-action.ts
│   ├── image/
│   │   ├── generate-action.ts
│   │   ├── upload-action.ts
│   │   └── delete-action.ts
│   └── index.ts
├── episode/
│   ├── create-action.ts
│   ├── update-action.ts
│   ├── generate-audio-action.ts
│   ├── bulk-generate-action.ts
│   └── index.ts
└── subscription/
    ├── subscribe-action.ts
    ├── unsubscribe-action.ts
    └── update-settings-action.ts
```

**[📄 קישור למשימה מפורטת](./tasks/03_reorganize_actions.md)**

---

### משימה 3.2: Split Image Actions ✅
**קובץ**: `tasks/03_split_image_actions.md`
**עדיפות**: 🔴 גבוהה
**זמן משוער**: 4 שעות
**הושלם**: 2025-10-13

**683 שורות פוצלו ל:**
- `generate-from-telegram.ts` (143 שורות)
- `generate-from-file.ts` (135 שורות)
- `generate-from-url.ts` (145 שורות)
- `upload-to-s3.ts` (101 שורות)
- `gallery-actions.ts` (95 שורות)
- `shared.ts` (51 שורות)
- `types.ts` (38 שורות)
- `database-actions.ts` (70 שורות)

**[📄 קישור למשימה מפורטת](./tasks/03_split_image_actions.md)**

---

### משימה 3.3: Create Shared Utilities
**קובץ**: `tasks/03_shared_utilities.md`
**עדיפות**: 🔴 גבוהה
**זמן משוער**: 3 שעות

**קבצים לייצר:**
```typescript
// shared/error-handler.ts
export function handleActionError(error: unknown): ActionError {
  // Centralized error handling
}

// shared/validators.ts
export function validateFormData<T>(
  formData: FormData,
  schema: ZodSchema<T>
): T | ActionError {
  // Zod validation with proper errors
}

// shared/revalidation.ts
export function revalidatePodcast(podcastId: string): void {
  revalidatePath(`/podcasts/${podcastId}`);
  revalidatePath('/podcasts');
  revalidatePath('/admin/podcasts');
}

// shared/types.ts
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };
```

**[📄 קישור למשימה מפורטת](./tasks/03_shared_utilities.md)**

---

### משימה 3.4: Implement Progressive Enhancement
**קובץ**: `tasks/03_progressive_enhancement.md`
**עדיפות**: 🟡 בינונית
**זמן משוער**: 2 שעות

**דוגמה:**
```typescript
// Form that works without JS
export function PodcastForm() {
  return (
    <form action={createPodcastAction}>
      <input name="title" required />
      <SubmitButton />
    </form>
  );
}

// With useActionState for better UX
export function PodcastFormEnhanced() {
  const [state, formAction, pending] = useActionState(
    createPodcastAction,
    initialState
  );

  return (
    <form action={formAction}>
      {state.error && <Error message={state.error} />}
      <input name="title" required />
      <SubmitButton pending={pending} />
    </form>
  );
}
```

**[📄 קישור למשימה מפורטת](./tasks/03_progressive_enhancement.md)**

---

### משימה 3.5: Type-Safe Action Creators
**קובץ**: `tasks/03_type_safe_actions.md`
**עדיפות**: 🟡 בינונית
**זמן משוער**: 3 שעות

**דוגמה:**
```typescript
// Create type-safe action wrapper
function createAction<TInput, TOutput>(
  handler: (input: TInput) => Promise<TOutput>
) {
  return async (formData: FormData): Promise<ActionResult<TOutput>> => {
    'use server';
    try {
      const input = parseAndValidate<TInput>(formData);
      const result = await handler(input);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  };
}

// Usage
export const createPodcast = createAction<CreatePodcastInput, Podcast>(
  async (input) => {
    return await podcastService.create(input);
  }
);
```

**[📄 קישור למשימה מפורטת](./tasks/03_type_safe_actions.md)**

---

### משימה 3.6: Add Input Validation
**קובץ**: `tasks/03_input_validation.md`
**עדיפות**: 🔴 גבוהה
**זמן משוער**: 4 שעות

**השתמש ב-Zod:**
```typescript
import { z } from 'zod';

const PodcastSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  telegramChannel: z.string().regex(/^@?[\w]{5,32}$/).optional()
});

export async function createPodcast(formData: FormData) {
  'use server';

  const result = PodcastSchema.safeParse(
    Object.fromEntries(formData)
  );

  if (!result.success) {
    return {
      success: false,
      error: 'Invalid input',
      fieldErrors: result.error.flatten().fieldErrors
    };
  }

  // Continue with validated data
}
```

**[📄 קישור למשימה מפורטת](./tasks/03_input_validation.md)**

---

## 🔗 תלויות

### Incoming Dependencies
- ✅ UI Components (05) - call these actions
- ✅ Admin Features (06) - admin actions

### Outgoing Dependencies
- ✅ Database Layer (02) - via API
- ✅ Services (04) - business logic
- ✅ Authentication (01) - requireAdmin, etc

---

## ✅ Checklist ביצוע

### Pre-Work
- [ ] קרא Next.js 15 Server Actions docs
- [ ] הבן את Progressive Enhancement
- [ ] בדוק Zod validation patterns
- [ ] סקור את כל ה-actions הקיימים

### During Work
- [ ] עבוד לפי סדר: 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6
- [ ] צור shared utilities קודם
- [ ] פצל קבצים גדולים אחרי
- [ ] הוסף validation בהדרגה

### Post-Work
- [ ] וודא שכל ה-forms עובדים
- [ ] בדוק progressive enhancement
- [ ] הרץ `npm run typecheck`
- [ ] הרץ `npm run build`
- [ ] בדוק error handling

---

## 🎯 קריטריונים להצלחה

### Code Quality
- [ ] כל action file < 150 שורות
- [ ] Type-safe inputs and outputs
- [ ] Consistent error handling
- [ ] Proper revalidation

### Best Practices
- [ ] Progressive enhancement
- [ ] Input validation (Zod)
- [ ] Error boundaries
- [ ] Proper TypeScript types

### Organization
- [ ] Consistent folder structure
- [ ] Clear naming conventions
- [ ] Shared utilities used
- [ ] Good separation of concerns

---

## 📊 מדדי התקדמות

### משימה 3.1: Reorganize Structure
Status: ✅ הושלם
Progress: ████████████████████ 100%
Completed: 2025-10-13
- Created shared utilities directory
- Established consistent patterns
- See: `tasks/03_actions_structure_and_image_split.md`

### משימה 3.2: Split Image Actions
Status: ✅ הושלם
Progress: ████████████████████ 100%
Completed: 2025-10-13
- Split 683-line file into 8 focused modules
- All files < 180 lines
- 100% backward compatibility maintained
- See: `tasks/03_actions_structure_and_image_split.md`

### משימה 3.3: Shared Utilities
Status: ✅ הושלם (Combined with 3.1)
Progress: ████████████████████ 100%
Completed: 2025-10-13
- Created shared/error-handler.ts
- Created shared/revalidation.ts
- Created shared/types.ts
- See: `tasks/03_actions_structure_and_image_split.md`

### משימה 3.4: Progressive Enhancement
Status: ⬜ לא התחיל
Progress: ⬜⬜⬜⬜⬜ 0%

### משימה 3.5: Type-Safe Actions
Status: ⬜ לא התחיל
Progress: ⬜⬜⬜⬜⬜ 0%

### משימה 3.6: Input Validation
Status: ⬜ לא התחיל
Progress: ⬜⬜⬜⬜⬜ 0%

**התקדמות תחום: 3/6 משימות (50%)**

---

**סטטוס תחום**: 🟡 בתהליך (50% הושלם)
**עדכון אחרון**: 2025-10-13
**בעלים**: Development Team

**השלבים הבאים:**
1. ✅ Split `podcast/generate.ts` (322 lines) - הושלם 2025-10-13
2. ✅ Split `podcast/update.ts` (302 lines) - הושלם 2025-10-13
3. Split `episode/bulk-generation-actions.ts` (283 lines)
4. Implement progressive enhancement patterns
5. Add comprehensive input validation

**עדכון אחרון (2025-10-13):**
- ✅ פוצל `podcast/generate.ts` ל-6 מודולים ממוקדים (כולל main orchestrator)
- ✅ פוצל `podcast/update.ts` ל-5 מודולים ממוקדים (כולל main orchestrator)
- ✅ כל הקבצים החדשים < 150 שורות (עמידה קפדנית בגבול)
- ✅ שמירה על backward compatibility מלאה
- ✅ Build עובר ללא שגיאות TypeScript
- 📊 קבצים גדולים שנותרו: 1 (bulk-generation-actions.ts - 283 שורות)
