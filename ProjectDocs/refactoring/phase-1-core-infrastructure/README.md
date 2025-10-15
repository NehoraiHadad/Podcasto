# Phase 1: Core Infrastructure (תשתיות) 🏗️

**משך משוער:** 3-4 ימי עבודה
**עדיפות:** 🔴 High (תשתית קריטית)
**Status:** 📝 Planning

---

## 📋 סקירה כללית

פאזה זו מתמקדת בשכבות הליבה של האפליקציה - Database, Authentication, ו-Error Handling. אלו התשתיות הקריטיות ביותר שעליהן נשענים כל שאר חלקי המערכת.

---

## 🎯 מטרות הפאזה

### Database Layer
- ✅ אופטימיזציה של queries ב-Drizzle ORM
- ✅ שיפור transaction handling
- ✅ פיצול קבצים גדולים (>200 שורות)
- ✅ יישום Identity Columns (PostgreSQL standard 2025)

### Authentication & Security
- ✅ רפקטור role-service.ts (610 שורות)
- ✅ שיפור session-service.ts (307 שורות)
- ✅ דיוק error-utils.ts (392 שורות)
- ✅ יישום Supabase SSR best practices

### Error Handling
- ✅ איחוד error handling patterns
- ✅ Validation schemas עם Zod
- ✅ Type-safe error responses
- ✅ Centralized error logging

---

## 📚 דוקומנטציה רלוונטית

### Drizzle ORM (2025 Best Practices)
- **Official Guide:** https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717
- **Drizzle Docs:** https://orm.drizzle.team/
- **Identity Columns:** https://orm.drizzle.team/docs/column-types/pg#integer

#### עדכון קריטי 2025:
```typescript
// ❌ OLD (Serial - deprecated)
id: serial('id').primaryKey()

// ✅ NEW (Identity - PostgreSQL standard)
id: integer('id').generatedAlwaysAsIdentity().primaryKey()
```

### Supabase Auth + Next.js 15
- **Server-Side Auth:** https://supabase.com/docs/guides/auth/server-side/nextjs
- **SSR Package:** https://supabase.com/docs/guides/auth/auth-helpers/nextjs

#### Best Practices קריטיים:
```typescript
// ⚠️ NEVER use in server code
const { data } = await supabase.auth.getSession()

// ✅ ALWAYS use (validates token)
const { data } = await supabase.auth.getUser()
```

### TypeScript Strict Mode
- **tsconfig.json:** https://www.typescriptlang.org/tsconfig
- **Strict Type Checking:** https://www.typescriptlang.org/tsconfig#strict

---

## 📦 משימות (Tasks)

### Task 1.1: Database Layer Optimization
**קובץ:** `task-1.1-database-layer.md`
**משך:** 1-1.5 ימים
**קבצים:** ~15 קבצים

- Database API queries
- Relations optimization
- Transaction patterns
- Type definitions

### Task 1.2: Auth & Security Enhancement
**קובץ:** `task-1.2-auth-security.md`
**משך:** 1.5-2 ימים
**קבצים:** ~10 קבצים

- Role service refactoring
- Session management
- Permissions system
- Middleware optimization

### Task 1.3: Error Handling Standardization
**קובץ:** `task-1.3-error-handling.md`
**משך:** 0.5-1 יום
**קבצים:** ~5 קבצים

- Error classes
- Validation schemas
- Error responses
- Logging patterns

---

## 🗂️ קבצים מעורבים

### Database Layer (~15 קבצים)
```
src/lib/db/
├── api/
│   ├── episodes.ts                    (226 שורות → split)
│   ├── podcasts.ts.backup            (migrate to new structure)
│   ├── podcast-configs.ts            (187 שורות)
│   ├── profiles.ts                   (208 שורות → split)
│   ├── sent-episodes.ts              (184 שורות)
│   ├── subscriptions.ts              (optimize)
│   ├── user-roles.ts                 (optimize)
│   └── podcasts/
│       ├── index.ts                  (already good!)
│       ├── queries.ts
│       ├── mutations.ts
│       ├── relations.ts              (review)
│       └── enrichment.ts
└── schema/
    ├── *.ts                          (check identity columns)
    └── relations.ts
```

### Auth & Security (~10 קבצים)
```
src/lib/auth/
├── role-service.ts                   (610 שורות → SPLIT)
├── session-service.ts                (307 שורות → refactor)
├── error-utils.ts                    (392 שורות → split)
├── errors.ts                         (312 שורות → organize)
├── permissions.ts                    (193 שורות → review)
└── types.ts                          (optimize)

src/middleware.ts                     (60 שורות → enhance)
```

### Error Handling (~5 קבצים)
```
src/lib/
├── auth/errors.ts                    (centralize)
├── utils/validation.ts               (create if missing)
└── constants/error-codes.ts          (create if missing)
```

---

## ✅ Checklist Phase 1

### Pre-Work
- [ ] קריאת כל התיעוד המפורט (3 task files)
- [ ] סקירת הקבצים המעורבים
- [ ] הרצת `npm run build` - baseline
- [ ] יצירת branch: `refactor/phase-1-core-infrastructure`

### Task 1.1: Database Layer
- [ ] סקירת database queries
- [ ] יישום Identity Columns
- [ ] פיצול קבצים גדולים
- [ ] אופטימיזציה של relations
- [ ] Transaction handling
- [ ] Type safety improvements
- [ ] Build + Test

### Task 1.2: Auth & Security
- [ ] רפקטור role-service.ts
- [ ] שיפור session-service.ts
- [ ] דיוק permissions system
- [ ] Middleware enhancement
- [ ] Error handling in auth
- [ ] Supabase SSR patterns
- [ ] Build + Test

### Task 1.3: Error Handling
- [ ] איחוד error classes
- [ ] Validation schemas (Zod)
- [ ] Error response standardization
- [ ] Logging improvements
- [ ] Build + Test

### Post-Work
- [ ] `npm run build` - success
- [ ] `npm run lint` - no errors
- [ ] `npm test` - all pass (if exists)
- [ ] Git diff review
- [ ] Commit changes
- [ ] Update task status in docs

---

## 🔍 Testing Strategy

### Database Layer
```bash
# Test queries
npm run test -- src/lib/db

# Manual verification
- Create podcast → check DB
- Update episode → check DB
- Delete records → check relations
```

### Auth & Security
```bash
# Test authentication flows
- Login → check session
- Logout → check cleanup
- Protected routes → check middleware
- Role checks → verify permissions
```

### Error Handling
```bash
# Test error scenarios
- Invalid input → check validation
- Auth errors → check messages
- DB errors → check logging
```

---

## 📊 Success Metrics

### Code Quality
- [ ] Avg file size < 150 lines
- [ ] No TypeScript errors
- [ ] No ESLint warnings (critical)
- [ ] All functions have return types

### Performance
- [ ] Build time < 60s
- [ ] No performance regressions
- [ ] Database queries optimized

### Maintainability
- [ ] Clear file structure
- [ ] Consistent naming
- [ ] JSDoc comments added
- [ ] README updated

---

## 🚨 Important Notes

### Breaking Changes
⚠️ **אף שינוי לא ישבור את ה-API הציבורי!**

### Migration Notes
- שינויים בסכמת DB דורשים migration
- Auth changes דורשים זהירות (sessions!)
- Error handling changes - backward compatible

### Rollback Plan
אם משהו לא עובד:
```bash
git checkout main -- src/lib/db
git checkout main -- src/lib/auth
# etc.
```

---

## 📝 Documentation Updates

אחרי השלמת Phase 1:
- [ ] Update CLAUDE.md if needed
- [ ] Document new patterns
- [ ] Update architecture diagrams (if exists)
- [ ] Add inline JSDoc comments

---

**Next Phase:** [Phase 2: Business Logic](../phase-2-business-logic/README.md)

---

**Updated:** 2025-01-15
**Status:** 📝 Planning → 🏗️ Ready to Start
