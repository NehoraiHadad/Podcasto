# Authentication Module

This module provides centralized session management for Podcasto, following 2025 Supabase best practices for Next.js 15 App Router.

## Overview

The authentication module consists of three main components:

1. **SessionService** (`session-service.ts`) - Core session management operations
2. **Session Utilities** (`session-utils.ts`) - Helper functions for session validation
3. **Types** (`types.ts`) - TypeScript type definitions

## Quick Start

```typescript
import { SessionService } from '@/lib/auth';

// Get current user
const user = await SessionService.getUser();

// Get authentication state
const { user, session, isAuthenticated } = await SessionService.getAuthState();

// Validate session
const validation = await SessionService.validateSession();

// Sign out
await SessionService.clearSession();
```

## SessionService API

### `getUser()`
Get the current authenticated user. This method is **cached per request** to avoid redundant database calls.

**Important**: Uses `supabase.auth.getUser()` which validates the JWT server-side (never trust `getSession()` on the server).

```typescript
const user = await SessionService.getUser();
if (user) {
  console.log(`Authenticated as ${user.email}`);
}
```

**Returns**: `Promise<User | null>`

---

### `getSession()`
Get the current session from storage.

**Note**: For server-side validation, prefer `getUser()` or `getAuthState()`.

```typescript
const session = await SessionService.getSession();
if (session) {
  console.log(`Session expires at ${session.expires_at}`);
}
```

**Returns**: `Promise<Session | null>`

---

### `getAuthState()`
Get complete authentication state including user, session, and authentication status.

```typescript
const authState = await SessionService.getAuthState();
if (authState.isAuthenticated) {
  console.log(`User: ${authState.user?.email}`);
  console.log(`Session expires: ${authState.session?.expires_at}`);
}
```

**Returns**: `Promise<AuthState>`

```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
}
```

---

### `refreshSession(options?)`
Manually refresh the authentication token.

**Note**: Typically handled automatically by middleware, but can be called manually if needed.

```typescript
// Refresh only if needed (default)
const result = await SessionService.refreshSession();

// Force refresh regardless of expiry
const result = await SessionService.refreshSession({ forceRefresh: true });

if (result.success) {
  console.log('Session refreshed successfully');
} else {
  console.error('Refresh failed:', result.error);
}
```

**Parameters**:
- `options.forceRefresh` (optional): Force refresh even if not needed

**Returns**: `Promise<AuthResult<Session>>`

---

### `validateSession()`
Validate the current session and get detailed validation info.

```typescript
const validation = await SessionService.validateSession();

if (validation.isValid) {
  console.log(`Session valid for ${validation.expiresIn} more seconds`);
} else if (validation.isExpired) {
  console.log('Session has expired');
}
```

**Returns**: `Promise<SessionValidation>`

```typescript
interface SessionValidation {
  isValid: boolean;
  isExpired: boolean;
  expiresAt: number | null;  // Milliseconds since epoch
  expiresIn: number | null;  // Seconds until expiry
}
```

---

### `clearSession()`
Sign out the user and clear all session data.

```typescript
const result = await SessionService.clearSession();

if (result.success) {
  console.log('Successfully signed out');
} else {
  console.error('Sign out failed:', result.error);
}
```

**Returns**: `Promise<AuthResult>`

---

## Session Utilities

Helper functions for session validation and expiry checks.

### `isSessionExpired(session)`
Check if a session is expired.

```typescript
import { isSessionExpired } from '@/lib/auth';

const session = await supabase.auth.getSession();
if (isSessionExpired(session.data.session)) {
  console.log('Session expired');
}
```

---

### `shouldRefreshSession(session, thresholdSeconds?)`
Check if a session should be refreshed based on expiry threshold.

Default threshold: 5 minutes before expiry

```typescript
import { shouldRefreshSession } from '@/lib/auth';

const session = await supabase.auth.getSession();
if (shouldRefreshSession(session.data.session)) {
  // Refresh needed
}

// Custom threshold (1 minute)
if (shouldRefreshSession(session.data.session, 60)) {
  // Refresh needed
}
```

---

### `getSessionExpiryTime(session)`
Get the expiry time in milliseconds since epoch.

```typescript
import { getSessionExpiryTime } from '@/lib/auth';

const session = await supabase.auth.getSession();
const expiryTime = getSessionExpiryTime(session.data.session);
if (expiryTime) {
  const date = new Date(expiryTime);
  console.log(`Expires: ${date.toLocaleString()}`);
}
```

---

### `getSecondsUntilExpiry(session)`
Get seconds remaining until session expiry.

```typescript
import { getSecondsUntilExpiry } from '@/lib/auth';

const session = await supabase.auth.getSession();
const seconds = getSecondsUntilExpiry(session.data.session);
if (seconds) {
  console.log(`${seconds} seconds until expiry`);
}
```

---

### `formatSessionExpiry(session)`
Format session expiry as a human-readable string.

```typescript
import { formatSessionExpiry } from '@/lib/auth';

const session = await supabase.auth.getSession();
console.log(`Expires: ${formatSessionExpiry(session.data.session)}`);
// Output: "Expires: 10/13/2025, 3:45:00 PM"
```

---

## TypeScript Types

All types are fully documented and exported:

```typescript
import type {
  User,
  Session,
  AuthState,
  AuthResult,
  AuthError,
  SessionValidation,
  RefreshSessionOptions,
} from '@/lib/auth';
```

### `AuthResult<T>`
Standard result type for auth operations:

```typescript
interface AuthResult<T = void> {
  success: boolean;
  data?: T;
  error?: AuthError;
}
```

### `AuthError`
Standardized error structure:

```typescript
interface AuthError {
  message: string;
  code?: string;
  status?: number;
}
```

---

## Best Practices

### 1. Server-Side Validation
Always use `getUser()` for server-side authentication checks:

```typescript
// ✅ CORRECT - Validates JWT server-side
const user = await SessionService.getUser();

// ❌ WRONG - Don't trust getSession() on server
const { session } = await supabase.auth.getSession();
```

### 2. Caching
`getUser()` is cached per request. Subsequent calls in the same request return the cached value:

```typescript
// First call: Database query
const user1 = await SessionService.getUser();

// Second call: Returns cached value (same request)
const user2 = await SessionService.getUser();
```

### 3. Error Handling
Always handle errors from auth operations:

```typescript
const result = await SessionService.refreshSession();

if (!result.success) {
  if (result.error) {
    console.error(`Auth error: ${result.error.message}`);
  }
}
```

### 4. Session Refresh
Let middleware handle automatic refresh. Only call `refreshSession()` manually when:
- You need to force a refresh
- You're in a context without middleware

### 5. Type Safety
Use the provided types for type-safe operations:

```typescript
import type { AuthState } from '@/lib/auth';

async function checkAuth(): Promise<AuthState> {
  return await SessionService.getAuthState();
}
```

---

## Integration with Existing Code

This SessionService integrates seamlessly with existing Supabase setup:

- **Supabase Client**: Uses `createClient()` from `@/lib/supabase/server`
- **Middleware**: Works with existing middleware in `src/middleware.ts`
- **Type Definitions**: Compatible with `@/lib/supabase/types`

---

## Migration Guide

If you're currently using direct Supabase client calls, migrate to SessionService:

**Before**:
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
```

**After**:
```typescript
import { SessionService } from '@/lib/auth';
const user = await SessionService.getUser();
```

**Before**:
```typescript
const supabase = await createClient();
await supabase.auth.signOut();
```

**After**:
```typescript
import { SessionService } from '@/lib/auth';
await SessionService.clearSession();
```

---

## Architecture Notes

### Why This Design?

1. **Single Responsibility**: Each file has a clear purpose
2. **Type Safety**: Full TypeScript coverage with no `any` types
3. **Caching**: Reduces redundant database calls
4. **Error Handling**: Consistent error structure across all methods
5. **2025 Best Practices**: Follows latest Supabase recommendations
6. **Testing**: Pure functions in utilities make testing easier

### Session Flow

```
User Request
     ↓
Middleware (refreshes token if needed)
     ↓
SessionService.getUser() (validates JWT)
     ↓
Cached for request duration
     ↓
Returns User | null
```

---

## FAQ

**Q: When should I use `getUser()` vs `getSession()`?**
A: Use `getUser()` for authentication checks. Only use `getSession()` when you specifically need session metadata.

**Q: Why is `getUser()` cached?**
A: To avoid multiple database queries in the same request. React's `cache()` ensures one call per request.

**Q: How do I force a session refresh?**
A: Call `SessionService.refreshSession({ forceRefresh: true })`

**Q: What's the difference between `isSessionExpired()` and `shouldRefreshSession()`?**
A: `isSessionExpired()` checks if already expired. `shouldRefreshSession()` checks if refresh is needed soon (default: 5 minutes before expiry).

**Q: Can I use this in Client Components?**
A: No, SessionService is server-side only (`'use server'` directive). Use the existing browser client for client-side operations.

---

## File Structure

```
src/lib/auth/
├── index.ts              # Public API exports
├── session-service.ts    # Core session operations
├── session-utils.ts      # Utility functions
├── types.ts             # Type definitions
└── README.md            # This file
```

---

## Support

For questions or issues:
1. Check this README first
2. Review the JSDoc comments in source files
3. Consult [Supabase Auth Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)
4. Check `CLAUDE.md` for project-specific patterns

---

Last Updated: 2025-10-13
