# SessionService Integration Examples

This document provides practical examples of integrating the new SessionService into existing Podcasto code.

## Example 1: Server Action Authentication Check

**Before** (scattered auth logic):
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';

export async function updatePodcast(id: string, data: any) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  // ... rest of logic
}
```

**After** (using SessionService):
```typescript
'use server';

import { SessionService } from '@/lib/auth';

export async function updatePodcast(id: string, data: any) {
  const user = await SessionService.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // ... rest of logic
}
```

---

## Example 2: Server Component User Display

**Before**:
```typescript
import { createClient } from '@/lib/supabase/server';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not logged in</div>;
  }

  return <div>Welcome {user.email}</div>;
}
```

**After**:
```typescript
import { SessionService } from '@/lib/auth';

export default async function ProfilePage() {
  const user = await SessionService.getUser();

  if (!user) {
    return <div>Not logged in</div>;
  }

  return <div>Welcome {user.email}</div>;
}
```

---

## Example 3: Admin Route Protection

**Before**:
```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check admin role...
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleData?.role !== 'admin') {
    redirect('/unauthorized');
  }

  return <AdminDashboard />;
}
```

**After**:
```typescript
import { SessionService } from '@/lib/auth';
import { checkIsAdmin } from '@/lib/actions/admin-actions';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const user = await SessionService.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    redirect('/unauthorized');
  }

  return <AdminDashboard />;
}
```

---

## Example 4: Session Validation with Expiry Check

**New capability** - Check session expiry before expensive operations:

```typescript
import { SessionService } from '@/lib/auth';

export async function processLongRunningTask() {
  // Check session is valid and not expiring soon
  const validation = await SessionService.validateSession();

  if (!validation.isValid) {
    return { success: false, error: 'Session expired' };
  }

  // Warn if session expires in less than 5 minutes
  if (validation.expiresIn && validation.expiresIn < 300) {
    console.warn(`Session expires in ${validation.expiresIn}s`);

    // Optionally refresh
    await SessionService.refreshSession();
  }

  // Proceed with task
  // ...
}
```

---

## Example 5: Conditional UI Based on Auth State

**New capability** - Get full auth state in one call:

```typescript
import { SessionService } from '@/lib/auth';

export default async function HomePage() {
  const authState = await SessionService.getAuthState();

  return (
    <div>
      <h1>Welcome to Podcasto</h1>

      {authState.isAuthenticated ? (
        <UserMenu
          user={authState.user}
          sessionExpiry={authState.session?.expires_at}
        />
      ) : (
        <LoginPrompt />
      )}
    </div>
  );
}
```

---

## Example 6: API Route with Session Validation

**Before**:
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // ... fetch data
  return NextResponse.json({ data });
}
```

**After**:
```typescript
import { SessionService } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await SessionService.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // ... fetch data
  return NextResponse.json({ data });
}
```

---

## Example 7: Sign Out Action

**Before**:
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}
```

**After**:
```typescript
'use server';

import { SessionService } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function signOutAction() {
  const result = await SessionService.clearSession();

  if (!result.success) {
    console.error('Sign out failed:', result.error);
  }

  redirect('/auth/login');
}
```

---

## Example 8: Multiple Auth Checks in Same Request

**Benefit** - Automatic caching prevents redundant DB calls:

```typescript
import { SessionService } from '@/lib/auth';

export default async function DashboardPage() {
  // First call: Queries database
  const user = await SessionService.getUser();

  if (!user) {
    return <LoginRequired />;
  }

  return (
    <div>
      <Header user={user} />
      <Sidebar userId={user.id} />
      <MainContent />
    </div>
  );
}

// In Header component (same request)
async function Header({ user }: { user: User }) {
  // Second call: Returns cached value (no DB query)
  const currentUser = await SessionService.getUser();

  return <div>Hello {currentUser?.email}</div>;
}
```

---

## Example 9: Utility Function for Session Expiry Display

**New capability** - Format session expiry for UI:

```typescript
import { formatSessionExpiry, getSecondsUntilExpiry } from '@/lib/auth';

export default async function SessionInfo() {
  const session = await SessionService.getSession();

  if (!session) {
    return <div>No active session</div>;
  }

  const expiryTime = formatSessionExpiry(session);
  const secondsLeft = getSecondsUntilExpiry(session);

  return (
    <div>
      <p>Session expires: {expiryTime}</p>
      {secondsLeft && secondsLeft < 600 && (
        <Warning>Session expires in {Math.floor(secondsLeft / 60)} minutes</Warning>
      )}
    </div>
  );
}
```

---

## Example 10: Error Handling with Type Guards

**New capability** - Type-safe error handling:

```typescript
import { SessionService, isAuthError } from '@/lib/auth';

export async function handleAuthOperation() {
  const result = await SessionService.refreshSession();

  if (!result.success) {
    if (isAuthError(result.error)) {
      // TypeScript knows result.error is AuthError
      console.error(`Auth error [${result.error.code}]: ${result.error.message}`);

      if (result.error.status === 401) {
        // Handle unauthorized
      }
    }
  }
}
```

---

## Testing Examples

### Unit Test: Session Utils

```typescript
import { isSessionExpired, shouldRefreshSession } from '@/lib/auth';

describe('Session Utilities', () => {
  it('detects expired sessions', () => {
    const expiredSession = {
      expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      // ... other session fields
    };

    expect(isSessionExpired(expiredSession)).toBe(true);
  });

  it('recommends refresh before expiry', () => {
    const expiringSession = {
      expires_at: Math.floor(Date.now() / 1000) + 60, // 1 minute from now
      // ... other session fields
    };

    // Should refresh if less than 5 minutes remaining
    expect(shouldRefreshSession(expiringSession)).toBe(true);
  });
});
```

### Integration Test: SessionService

```typescript
import { SessionService } from '@/lib/auth';

describe('SessionService', () => {
  it('returns null for unauthenticated users', async () => {
    // Mock no auth
    const user = await SessionService.getUser();
    expect(user).toBeNull();
  });

  it('returns auth state correctly', async () => {
    // Mock authenticated user
    const authState = await SessionService.getAuthState();

    expect(authState).toHaveProperty('user');
    expect(authState).toHaveProperty('session');
    expect(authState).toHaveProperty('isAuthenticated');
  });
});
```

---

## Migration Checklist

When migrating existing code to use SessionService:

- [ ] Replace direct `supabase.auth.getUser()` calls with `SessionService.getUser()`
- [ ] Replace `supabase.auth.getSession()` with `SessionService.getSession()` (if needed)
- [ ] Replace `supabase.auth.signOut()` with `SessionService.clearSession()`
- [ ] Add session validation checks before long-running operations
- [ ] Use `getAuthState()` when you need both user and session
- [ ] Remove duplicate auth checks in the same request (leverage caching)
- [ ] Update imports to use `@/lib/auth` instead of `@/lib/supabase/server`
- [ ] Add proper error handling using `AuthResult` type
- [ ] Update tests to use new SessionService methods

---

## Common Patterns

### Pattern 1: Require Authentication
```typescript
const user = await SessionService.getUser();
if (!user) {
  return { success: false, error: 'Authentication required' };
}
```

### Pattern 2: Optional Authentication
```typescript
const user = await SessionService.getUser();
const isPremium = user ? await checkPremiumStatus(user.id) : false;
```

### Pattern 3: Session Validation Before Action
```typescript
const validation = await SessionService.validateSession();
if (!validation.isValid) {
  return { success: false, error: 'Session expired' };
}
```

### Pattern 4: Auth State for Conditional Logic
```typescript
const { isAuthenticated, user } = await SessionService.getAuthState();
const content = isAuthenticated
  ? await getPersonalizedContent(user!.id)
  : await getPublicContent();
```

---

Last Updated: 2025-10-13
