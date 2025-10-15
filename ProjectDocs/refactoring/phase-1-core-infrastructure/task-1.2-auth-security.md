# Task 1.2: Auth & Security Enhancement

**Phase:** 1 - Core Infrastructure
**משך משוער:** 1.5-2 ימים
**עדיפות:** 🔴 Critical
**Status:** 📝 Planning

---

## 🎯 מטרה

שיפור שכבת האימות והאבטחה עם דגש על:
- רפקטור role-service.ts (610 שורות → פיצול)
- שיפור session management
- יישום Supabase SSR best practices (2025)
- אופטימיזציה של permissions system

---

## 📚 דוקומנטציה רלוונטית

### Supabase Auth (2025 Standards)
- **Server-Side Auth:** https://supabase.com/docs/guides/auth/server-side/nextjs
- **SSR Package:** https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- **Security Best Practices:** https://supabase.com/docs/guides/auth/auth-helpers/nextjs#authentication-helpers

###  Critical Security Updates:

```typescript
// ⚠️ NEVER use in server code (not validated)
const { data: { session } } = await supabase.auth.getSession()

// ✅ ALWAYS use (validates token with Supabase)
const { data: { user } } = await supabase.auth.getUser()
```

### Next.js 15 Middleware
- **Middleware Docs:** https://nextjs.org/docs/app/building-your-application/routing/middleware
- **Auth Patterns:** https://nextjs.org/docs/app/building-your-application/authentication

### React cache()
- **cache() API:** https://react.dev/reference/react/cache

---

## 📋 מצב נוכחי

### בעיות זוהות:

1. **role-service.ts - 610 שורות**
   ```
   - יותר מדי logic בקובץ אחד
   - Queries, Guards, Management מעורבבים
   - קשה לתחזוקה
   ```

2. **session-service.ts - 307 שורות**
   ```
   - יכול להיות יותר modular
   - חסר separation of concerns
   ```

3. **error-utils.ts - 392 שורות**
   ```
   - Utility functions מעורבבות
   - צריך פיצול לפי תפקיד
   ```

4. **middleware.ts - 60 שורות**
   ```
   - בסיסי מדי
   - חסר advanced patterns
   ```

---

## 🎯 מצב רצוי

### Structure for Auth Module:
```
src/lib/auth/
├── index.ts                    # Clean exports
│
├── role/
│   ├── index.ts                # Role exports
│   ├── queries.ts              # Role queries (cached)
│   ├── guards.ts               # require* functions
│   ├── checks.ts               # check* functions (detailed)
│   ├── management.ts           # add/remove roles
│   └── types.ts                # Role types
│
├── session/
│   ├── index.ts                # Session exports
│   ├── getters.ts              # Get session/user
│   ├── validators.ts           # Validate sessions
│   ├── middleware.ts           # Middleware helpers
│   └── types.ts                # Session types
│
├── permissions/
│   ├── index.ts                # Permissions exports
│   ├── definitions.ts          # Permission constants
│   ├── checks.ts               # Permission checking
│   └── types.ts                # Permission types
│
├── errors/
│   ├── index.ts                # Error exports
│   ├── classes.ts              # Error classes
│   ├── utils.ts                # Error utilities
│   ├── handlers.ts             # Error handlers
│   └── types.ts                # Error types
│
└── types.ts                    # Shared auth types
```

---

## 📂 קבצים מעורבים

### Priority 1 - role-service.ts (610 שורות):
```typescript
// Current structure
role-service.ts {
  - getUserRoles()              → role/queries.ts
  - hasRole()                   → role/queries.ts
  - isAdmin()                   → role/queries.ts
  - hasPermission()             → role/queries.ts
  - getUserPermissions()        → role/queries.ts

  - requireAuth()               → role/guards.ts
  - requireAdmin()              → role/guards.ts
  - requireRole()               → role/guards.ts
  - requirePermission()         → role/guards.ts

  - checkRole()                 → role/checks.ts
  - checkPermission()           → role/checks.ts
  - getUserHighestRole()        → role/checks.ts

  - addUserRole()               → role/management.ts
  - removeUserRole()            → role/management.ts
}
```

### Priority 2 - session-service.ts (307 שורות):
```typescript
// Current structure
session-service.ts {
  - createServerClient()        → session/getters.ts
  - getUser()                   → session/getters.ts
  - getSession()                → session/getters.ts (with warning)

  - validateSession()           → session/validators.ts
  - refreshSession()            → session/validators.ts

  - updateSession()             → session/middleware.ts
  - createMiddlewareClient()    → session/middleware.ts
}
```

### Priority 3 - error-utils.ts (392 שורות):
```typescript
// Current structure
error-utils.ts {
  - mapSupabaseError()          → errors/handlers.ts
  - handleAuthError()           → errors/handlers.ts
  - formatErrorResponse()       → errors/handlers.ts

  - isAuthError()               → errors/utils.ts
  - getErrorMessage()           → errors/utils.ts
  - logError()                  → errors/utils.ts
}
```

---

## 🔧 שלבי ביצוע

### Step 1: Refactor role-service.ts (0.6 יום)
- [ ] יצירת `src/lib/auth/role/` directory
- [ ] פיצול ל-6 קבצים (queries, guards, checks, management, types, index)
- [ ] העברת קוד עם cache() preservation
- [ ] Type safety improvements
- [ ] Update imports ב-dependent files
- [ ] Test all role operations

#### Example: role/queries.ts
```typescript
'use server';

import { cache } from 'react';
import { userRolesApi } from '@/lib/db/api';
import { ROLES } from '../permissions';

/**
 * Get all roles for a user (cached per request)
 */
export const getUserRoles = cache(
  async (userId: string) => {
    try {
      return await userRolesApi.getUserRoles(userId);
    } catch (error) {
      console.error('[RoleQueries] Error:', error);
      return [];
    }
  }
);

/**
 * Check if user has a specific role (cached)
 */
export const hasRole = cache(
  async (userId: string, role: string): Promise<boolean> => {
    const roles = await getUserRoles(userId);
    return roles.some((r) => r.role === role);
  }
);

/**
 * Check if user is an admin (cached)
 */
export const isAdmin = cache(
  async (userId: string): Promise<boolean> => {
    return await hasRole(userId, ROLES.ADMIN);
  }
);
```

#### Example: role/guards.ts
```typescript
'use server';

import { getUser } from '../session';
import { isAdmin, hasRole, hasPermission } from './queries';
import { UnauthorizedError, InsufficientPermissionsError } from '../errors';
import { ROLES, type Permission } from '../permissions';
import type { User } from '../types';

/**
 * Require user to be authenticated
 * @throws {UnauthorizedError} If not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getUser();

  if (!user) {
    throw new UnauthorizedError({
      action: 'requireAuth',
      timestamp: Date.now(),
    });
  }

  return user;
}

/**
 * Require user to be an admin
 * @throws {InsufficientPermissionsError} If not admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  const userIsAdmin = await isAdmin(user.id);

  if (!userIsAdmin) {
    throw new InsufficientPermissionsError({
      userId: user.id,
      requiredRole: ROLES.ADMIN,
      action: 'requireAdmin',
    });
  }

  return user;
}
```

### Step 2: Refactor session-service.ts (0.4 יום)
- [ ] יצירת `src/lib/auth/session/` directory
- [ ] פיצול ל-5 קבצים (getters, validators, middleware, types, index)
- [ ] Implement Supabase SSR patterns
- [ ] Security improvements (getUser over getSession)
- [ ] Update imports
- [ ] Test

#### Example: session/getters.ts
```typescript
'use server';

import { cookies } from 'next/headers';
import { createServerClient as createSupabaseClient } from '@supabase/ssr';
import type { User, Session } from '../types';

/**
 * Create Supabase server client (SSR-compatible)
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component - can't set cookies
          }
        },
      },
    }
  );
}

/**
 * Get authenticated user (ALWAYS use this in server code)
 * ✅ Validates token with Supabase Auth server
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get session (⚠️ USE WITH CAUTION - not validated)
 * Only safe in client components or specific scenarios
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Log warning in development
  if (process.env.NODE_ENV === 'development') {
    console.warn('[SessionService] getSession() used - consider getUser() instead');
  }

  return session;
}
```

### Step 3: Refactor error-utils.ts (0.3 יום)
- [ ] יצירת `src/lib/auth/errors/` directory
- [ ] פיצול ל-5 קבצים (classes, utils, handlers, types, index)
- [ ] Type safety improvements
- [ ] Update imports
- [ ] Test

### Step 4: Enhance middleware.ts (0.2 יום)
- [ ] שיפור session refresh logic
- [ ] הוספת advanced patterns
- [ ] Performance optimization
- [ ] Security improvements

#### Enhanced Middleware Example:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient, updateSession } from '@/lib/supabase/server';

const protectedRoutes = ['/profile', '/settings', '/podcasts/my'];
const adminRoutes = ['/admin'];
const publicRoutes = ['/auth', '/api/public'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip for public routes and static assets
  if (publicRoutes.some(route => pathname.startsWith(route)) ||
      pathname.startsWith('/_next') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // Update session (refresh tokens if needed)
  const response = await updateSession(request);

  // Check if route requires auth
  const routeRequiresAuth = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );
  const routeRequiresAdmin = adminRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (!routeRequiresAuth && !routeRequiresAdmin) {
    return response;
  }

  // Get user
  const { client } = createMiddlewareClient(request, response);
  const { data: { user } } = await client.auth.getUser();

  // Redirect if not authenticated
  if (!user) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Admin check handled by server actions
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

### Step 5: Update Dependent Files (0.2 יום)
- [ ] Update all imports throughout codebase
- [ ] Replace deprecated patterns
- [ ] Test all auth flows

### Step 6: Testing & Validation (0.3 יום)
- [ ] Test authentication flows
- [ ] Test role checks
- [ ] Test permissions
- [ ] Test middleware
- [ ] Security audit

---

## ✅ Acceptance Criteria

### Code Quality:
- [ ] כל הקבצים < 150 שורות
- [ ] אין TypeScript errors
- [ ] Security best practices (getUser over getSession)
- [ ] cache() preserved ב-role queries

### Functionality:
- [ ] Login/Logout works
- [ ] Role checks work
- [ ] Permissions work
- [ ] Middleware refreshes sessions
- [ ] Protected routes work

### Security:
- [ ] Using `getUser()` in server code
- [ ] Proper token validation
- [ ] Secure cookie handling
- [ ] No exposed secrets

---

## 🧪 Testing Checklist

```typescript
// Manual Tests
✓ Login → verify session created
✓ Access protected route → verify redirect
✓ Admin route → verify role check
✓ Logout → verify session cleared
✓ Token refresh → verify middleware
✓ Role assignment → verify permissions
```

---

## 🚨 הערות חשובות

### Security Critical:
⚠️ **ALWAYS use `getUser()`** in server code (not `getSession()`)

### Breaking Changes:
❌ **None** - only internal structure changes

### Migration Path:
```typescript
// Old
import { requireAdmin } from '@/lib/auth/role-service';

// New (same API!)
import { requireAdmin } from '@/lib/auth';
// or
import { requireAdmin } from '@/lib/auth/role';
```

---

## 📊 Success Metrics

### File Sizes:
- **role-service.ts**: 610 → 6 files × ~100 שורות
- **session-service.ts**: 307 → 5 files × ~60 שורות
- **error-utils.ts**: 392 → 5 files × ~80 שורות

### Security:
- [ ] No `getSession()` in server code
- [ ] All auth flows validated
- [ ] Zero security regressions

---

## 🔗 קישורים נוספים

- [Supabase Auth Helpers Migration](https://supabase.com/docs/guides/auth/auth-helpers/nextjs#migrating-from-supabase-auth-helpers)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/authentication#security-best-practices)

---

**Next Task:** [Task 1.3: Error Handling](./task-1.3-error-handling.md)

---

**Updated:** 2025-01-15
**Status:** 📝 Planning → 🚀 Ready to Execute
