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
| `api/episodes/[id]/completed/route.ts` | ? | - |
| `api/cron/episode-checker/route.ts` | ? | - |
| `api/cron/podcast-scheduler/route.ts` | ? | - |

### בעיות

1. **Error Handling לא אחיד**
2. **Validation חסרה**
3. **Response Types לא עקביים**
4. **Authentication checks מפוזרים**

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

## 📊 התקדמות: 0/4 משימות (0%)

**סטטוס**: 🔴 לא התחיל
