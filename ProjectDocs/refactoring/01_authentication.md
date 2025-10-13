# 🔐 תחום 1: Authentication & Authorization

## תאריך יצירה: 2025-10-13
## Phase: 2 (Core Logic)
## תלויות: Database Layer (02)

---

## 📊 מצב נוכחי

### קבצים רלוונטיים

| קובץ | שורות | בעיות מזוהות |
|------|-------|---------------|
| `src/lib/actions/auth-actions.ts` | 127 | ✅ גודל סביר, אבל logic מפוזר |
| `src/lib/actions/auth-password-actions.ts` | 88 | ✅ גודל סביר |
| `src/lib/actions/user-actions.ts` | 45 | ✅ קטן, אבל לא מאורגן |
| `src/middleware.ts` | ? | צריך לבדוק - session handling |
| `src/lib/supabase/server.ts` | ? | Client initialization |
| `src/lib/supabase/client.ts` | ? | Browser client |

### בעיות מזוהות

1. **Session Management מפוזר**
   - Logic של session refresh בכמה מקומות
   - אין centralized session service

2. **Error Handling לא אחיד**
   - כל action מטפל בשגיאות אחרת
   - חסרים error types מוגדרים

3. **Role Management לא מרוכז**
   - בדיקת admin בכמה מקומות
   - `checkIsAdmin` ו-`requireAdmin` - duplication

4. **Type Safety חלקי**
   - חסרים return types מוגדרים
   - User types לא עקביים

---

## 🎯 מטרות שיפור

### מטרה 1: Centralize Session Management
✅ יצירת `SessionService` מרכזי
✅ אחידות ב-session handling
✅ Refresh logic במקום אחד

### מטרה 2: Unified Error Handling
✅ Error types מוגדרים
✅ Error utility functions
✅ Consistent error responses

### מטרה 3: Role Management Service
✅ `RoleService` מרכזי
✅ Permission checks מאוחדים
✅ Role caching

### מטרה 4: Improve Type Safety
✅ Strict return types
✅ User type consistency
✅ Auth state types

---

## 📚 דוקומנטציה רלוונטית

### Supabase Auth (2025)

**Server-Side Auth Setup**
- https://supabase.com/docs/guides/auth/server-side/nextjs
- Cookie-based auth with SSR support
- JWT auto-refresh patterns

**Next.js 15 Integration**
- https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- Middleware setup for auth
- Server Component patterns

**Best Practices (2025 Guide)**
- HTTP-only cookies (avoid localStorage)
- SSR compatibility
- Edge function support
- Auto token refresh

### Next.js Middleware

**Auth Middleware Patterns**
- https://nextjs.org/docs/app/building-your-application/routing/middleware
- Session refresh in middleware
- Route protection strategies

**Key Insights:**
> "Middleware runs before cached content and routes are matched"
> Use for authentication checks before rendering

### Security Best Practices

**Session Management**
- Use server-side cookies only
- Implement CSRF protection
- Rotate session tokens
- Set proper cookie attributes (httpOnly, secure, sameSite)

**Role-Based Access Control (RBAC)**
- Centralize permission logic
- Use database for role definitions
- Cache role checks appropriately
- Implement principle of least privilege

---

## 📝 משימות מפורטות

### משימה 1.1: Create SessionService
**קובץ**: `tasks/01_session_service.md`
**עדיפות**: 🔴 גבוהה
**זמן משוער**: 2-3 שעות

**תיאור קצר:**
יצירת service מרכזי לניהול sessions עם Supabase Auth

**קבצים חדשים:**
- `src/lib/auth/session-service.ts`
- `src/lib/auth/types.ts`
- `src/lib/auth/__tests__/session-service.test.ts`

**[📄 קישור למשימה מפורטת](./tasks/01_session_service.md)**
Senior FRONTEND Developer - has extensive experience writing JS|TS applications in NEXTJS. TAILWIND AND shadcn
Writes clean and tidy code and maintains clean and DRY code principles.
Makes sure to read documentation before implementation to write "up-to-date" code according to official recommendations.
With knowledge of DB and authentication.
Familiar with supabase and security principles.
---

### משימה 1.2: Unified Error Handling
**קובץ**: `tasks/01_error_handling.md`
**עדיפות**: 🔴 גבוהה
**זמן משוער**: 2 שעות

**תיאור קצר:**
יצירת error types ו-utilities לטיפול אחיד בשגיאות auth

**קבצים חדשים:**
- `src/lib/auth/errors.ts`
- `src/lib/auth/error-utils.ts`

**[📄 קישור למשימה מפורטת](./tasks/01_error_handling.md)**

---

### משימה 1.3: Role Management Service
**קובץ**: `tasks/01_role_service.md`
**עדיפות**: 🟡 בינונית
**זמן משוער**: 3 שעות

**תיאור קצר:**
מיזוג ושיפור של role checking logic

**קבצים חדשים:**
- `src/lib/auth/role-service.ts`
- `src/lib/auth/permissions.ts`

**קבצים לעדכן:**
- `src/lib/actions/admin-actions.ts`
- `src/lib/actions/auth-actions.ts`

**[📄 קישור למשימה מפורטת](./tasks/01_role_service.md)**

---

## 🔗 תלויות

### Incoming Dependencies (מה תלוי בנו)
- ✅ Server Actions (03) - משתמש ב-auth checks
- ✅ Admin Features (06) - תלוי ב-role management
- ✅ API Routes (07) - משתמש ב-session validation

### Outgoing Dependencies (על מה אנחנו תלויים)
- ✅ Database Layer (02) - user_roles table
- ✅ Supabase client configuration

---

## ✅ Checklist ביצוע

### Pre-Work
- [ ] קרא את כל הדוקומנטציה המקושרת
- [ ] בדוק את ה-middleware הנוכחי
- [ ] הבן את מבנה ה-user_roles table
- [ ] סקור את השימוש הנוכחי ב-auth actions

### During Work
- [ ] עבוד לפי סדר המשימות (1.1 → 1.2 → 1.3)
- [ ] כתוב tests לכל service חדש
- [ ] עדכן את הקוד הקיים להשתמש ב-services החדשים
- [ ] וודא ש-types עקביים בכל מקום

### Post-Work
- [ ] הרץ `npm run typecheck`
- [ ] הרץ `npm run lint`
- [ ] הרץ `npm run build`
- [ ] בדוק שה-authentication flows עובדים
- [ ] עדכן את התיעוד

---

## 🎯 קריטריונים להצלחה

### Code Quality
- [ ] כל קובץ מתחת ל-150 שורות
- [ ] Full type coverage
- [ ] אין any types
- [ ] JSDoc comments לפונקציות ציבוריות

### Architecture
- [ ] Single Responsibility per service
- [ ] Clear separation of concerns
- [ ] Dependency injection בשימוש
- [ ] Easy to test

### Functionality
- [ ] כל authentication flows עובדים
- [ ] Session refresh אוטומטי
- [ ] Role checks מהירים (cached)
- [ ] Error messages ברורים

### Performance
- [ ] אין N+1 queries
- [ ] Role checks cached
- [ ] Middleware מהיר
- [ ] Session management efficient

---

## 📊 מדדי התקדמות

### משימה 1.1: SessionService
Status: ⬜ לא התחיל
Progress: ⬜⬜⬜⬜⬜ 0%

### משימה 1.2: Error Handling
Status: ⬜ לא התחיל
Progress: ⬜⬜⬜⬜⬜ 0%

### משימה 1.3: Role Service
Status: ⬜ לא התחיל
Progress: ⬜⬜⬜⬜⬜ 0%

**התקדמות תחום: 0/3 משימות (0%)**

---

## 🚦 Next Steps

1. התחל עם משימה 1.1 (SessionService)
2. קרא את הקובץ המפורט: `tasks/01_session_service.md`
3. עקוב אחר ה-checklist שם
4. עבור למשימה הבאה רק אחרי הצלחה מלאה

---

## 📝 הערות וטיפים

### על Supabase Auth
- השתמש ב-`createClient` מ-`@/lib/supabase/server` ב-Server Components
- השתמש ב-`createClient` מ-`@/lib/supabase/client` ב-Client Components
- **אל תשתמש** ב-service role key בצד הלקוח

### על Middleware
- Middleware רץ על **כל** request
- שמור על המינימום הדרוש
- השתמש ב-`matcher` כדי להגביל routes

### על Role Management
- Cache role checks בזיכרון (Redis/memory)
- Invalidate cache כשתפקידים משתנים
- תמיד verify בצד השרת

### על Errors
- אל תחשוף sensitive data בשגיאות
- Log detailed errors server-side
- Return generic errors לקליינט

---

**סטטוס תחום**: 🔴 לא התחיל
**עדכון אחרון**: 2025-10-13
**בעלים**: Development Team
