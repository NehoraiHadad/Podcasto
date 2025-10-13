# 🛣️ תחום 7: API Routes

## תאריך יצירה: 2025-10-13
## Phase: 1 (Foundation)
## תלויות: אין

---

## 📊 מצב נוכחי

### API Route Files

| Route | שורות | מצב |
|-------|-------|-----|
| `api/episodes/generate-audio/route.ts` | 331 | 🔴 גדול |
| `api/episodes/[id]/completed/route.ts` | 168 | 🔴 גדול |
| `api/episodes/[id]/generate-image/route.ts` | 135 | 🟡 סביר |
| `api/cron/episode-checker/route.ts` | 160 | 🔴 גדול |
| `api/cron/start-jobs/route.ts` | 142 | 🟡 סביר |
| `api/cron/podcast-scheduler/route.ts` | 87 | ✅ טוב |
| `api/cron/process-failed-episodes/route.ts` | 114 | ✅ טוב |
| `api/sqs/process-podcast/route.ts` | 124 | ✅ טוב |
| `api/podcasts/[podcastId]/status/route.ts` | 95 | ✅ טוב |
| `api/auth/session/route.ts` | 69 | ✅ טוב |

**סה"כ**: 10 route files, 1,425 שורות

### בעיות מזוהות

1. **Error Handling לא אחיד** - כל route מטפל בשגיאות אחרת
2. **Validation חסרה** - אין schema validation מרוכז
3. **Response Types לא עקביים** - פורמטים שונים של responses
4. **Authentication checks מפוזרים** - לוגיקת CRON_SECRET חוזרת 4 פעמים
5. **Helper functions מוטבעים** - פונקציות עזר בתוך route files
6. **קבצים גדולים מדי** - 3 קבצים מעל 150 שורות (הפרה של convention)

---

## 🎯 מטרות

1. **Unified Error Handling**
2. **Request Validation**
3. **Response Standardization**
4. **Auth Middleware**

---

## 📝 משימות

### 7.1: Create API Utilities
**[📄 tasks/07_api_utilities.md](./tasks/07_api_utilities.md)**

```typescript
export function createApiResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function createApiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}
```

### 7.2: Auth Middleware
**[📄 tasks/07_auth_middleware.md](./tasks/07_auth_middleware.md)**

```typescript
export function withAuth(handler: RouteHandler) {
  return async (req: Request) => {
    const user = await authenticate(req);
    if (!user) return unauthorizedResponse();
    return handler(req, user);
  };
}
```

### 7.3: Request Validation
**[📄 tasks/07_validation.md](./tasks/07_validation.md)**

Zod schemas לכל route

### 7.4: Refactor CRON Routes
**[📄 tasks/07_cron_routes.md](./tasks/07_cron_routes.md)**

---

## 📊 התקדמות

### משימה 7.1: Create API Utilities
Status: ✅ הושלם
Progress: ✅✅✅✅✅ 100%
תאריך השלמה: 2025-10-13

**קבצים שנוצרו**:
- `src/lib/api/response.ts` (131 שורות) - Response helpers
- `src/lib/api/auth.ts` (146 שורות) - Authentication utilities
- `src/lib/api/validation.ts` (115 שורות) - Request validation
- `src/lib/api/error-handler.ts` (131 שורות) - Error handling
- `src/lib/api/index.ts` (62 שורות) - Barrel exports
- `src/lib/api/USAGE_EXAMPLES.md` - תיעוד שימוש

### משימה 7.2: Auth Middleware
Status: ⬜ לא התחיל
Progress: ⬜⬜⬜⬜⬜ 0%

### משימה 7.3: Request Validation
Status: ⬜ לא התחיל
Progress: ⬜⬜⬜⬜⬜ 0%

### משימה 7.4: Refactor CRON Routes
Status: ⬜ לא התחיל
Progress: ⬜⬜⬜⬜⬜ 0%

**התקדמות כללית: 1/4 משימות (25%)**

**סטטוס תחום**: 🟡 התחיל (25% הושלם)
**עדכון אחרון**: 2025-10-13
