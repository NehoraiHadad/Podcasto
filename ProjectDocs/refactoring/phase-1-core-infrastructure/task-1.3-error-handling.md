# Task 1.3: Error Handling Standardization

**Phase:** 1 - Core Infrastructure
**משך משוער:** 0.5-1 יום
**עדיפות:** 🟡 Medium-High
**Status:** 📝 Planning

---

## 🎯 מטרה

סטנדרטיזציה של error handling במערכת עם דגש על:
- איחוד error handling patterns
- Validation schemas עם Zod
- Type-safe error responses
- Centralized logging

---

## 📚 דוקומנטציה רלוונטית

### Zod Validation
- **Official Docs:** https://zod.dev/
- **Error Handling:** https://zod.dev/ERROR_HANDLING

### TypeScript Error Handling
- **Best Practices:** https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates

### Next.js Error Handling
- **Error Boundaries:** https://nextjs.org/docs/app/building-your-application/routing/error-handling
- **Server Actions Errors:** https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#error-handling

---

## 📋 מצב נוכחי

### בעיות זוהות:

1. **Inconsistent Error Patterns**
   ```typescript
   // Pattern 1: throw
   throw new Error('Something failed');

   // Pattern 2: return { success: false }
   return { success: false, error: 'Failed' };

   // Pattern 3: try-catch inline
   try { ... } catch (e) { console.log(e) }
   ```

2. **Missing Validation**
   ```typescript
   // No input validation
   async function updatePodcast(id: string, data: any) {
     // Direct DB update without validation
   }
   ```

3. **Inconsistent Error Types**
   ```typescript
   // Multiple error formats
   { error: string }
   { message: string }
   { code: string, message: string }
   Error
   string
   ```

---

## 🎯 מצב רצוי

### Unified Error Response Format:
```typescript
// Success
type SuccessResponse<T> = {
  success: true;
  data: T;
};

// Error
type ErrorResponse = {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
};

// Combined
type ActionResponse<T> = SuccessResponse<T> | ErrorResponse;
```

### Validation Pattern:
```typescript
import { z } from 'zod';

// Define schema
const podcastSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  // ...
});

// Use in server action
export async function createPodcast(input: unknown) {
  // Validate
  const result = podcastSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.format(),
      },
    };
  }

  // Process validated data
  const podcast = await db.insert(podcasts).values(result.data);

  return {
    success: true,
    data: podcast,
  };
}
```

---

## 📂 קבצים לעדכון

### New Files to Create:
```
src/lib/
├── types/
│   ├── responses.ts         # Standard response types
│   └── errors.ts            # Error types
│
├── validation/
│   ├── schemas/
│   │   ├── podcast.ts       # Podcast validation
│   │   ├── episode.ts       # Episode validation
│   │   ├── user.ts          # User validation
│   │   └── index.ts         # Schema exports
│   ├── utils.ts             # Validation utilities
│   └── index.ts             # Validation exports
│
└── errors/
    ├── classes.ts           # Error classes (moved from auth)
    ├── handlers.ts          # Error handlers
    ├── logger.ts            # Error logging
    └── index.ts             # Error exports
```

### Files to Update:
```
src/lib/actions/
├── *-actions.ts             # Add validation
├── episode/*.ts             # Standardize errors
├── podcast/*.ts             # Standardize errors
└── admin/*.ts               # Standardize errors
```

---

## 🔧 שלבי ביצוע

### Step 1: Create Type Definitions (0.1 יום)
- [ ] Create `src/lib/types/responses.ts`
- [ ] Define ActionResponse type
- [ ] Define standard error codes
- [ ] Export types

#### responses.ts
```typescript
/**
 * Standard success response
 */
export type SuccessResponse<T> = {
  success: true;
  data: T;
};

/**
 * Standard error response
 */
export type ErrorResponse = {
  success: false;
  error: {
    message: string;
    code: ErrorCode;
    details?: unknown;
  };
};

/**
 * Combined action response
 */
export type ActionResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Standard error codes
 */
export enum ErrorCode {
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Database
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // External Services
  S3_ERROR = 'S3_ERROR',
  SES_ERROR = 'SES_ERROR',
  GEMINI_ERROR = 'GEMINI_ERROR',

  // General
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

### Step 2: Create Validation Schemas (0.2 יום)
- [ ] Create `src/lib/validation/schemas/` directory
- [ ] Define Zod schemas for all entities
- [ ] Create reusable schema pieces
- [ ] Export schemas

#### podcast.ts
```typescript
import { z } from 'zod';

/**
 * Base podcast fields
 */
const basePodcastFields = {
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must not exceed 255 characters'),

  description: z.string()
    .max(1000, 'Description too long')
    .optional(),

  language: z.string()
    .regex(/^[a-z]{2}-[A-Z]{2}$/, 'Invalid language code')
    .default('en-US'),

  is_paused: z.boolean().default(false),
};

/**
 * Schema for creating a podcast
 */
export const createPodcastSchema = z.object(basePodcastFields);

/**
 * Schema for updating a podcast
 */
export const updatePodcastSchema = z.object(basePodcastFields).partial();

/**
 * Schema for podcast ID
 */
export const podcastIdSchema = z.string().uuid('Invalid podcast ID');

// Type exports
export type CreatePodcastInput = z.infer<typeof createPodcastSchema>;
export type UpdatePodcastInput = z.infer<typeof updatePodcastSchema>;
```

### Step 3: Create Error Handlers (0.1 יום)
- [ ] Create `src/lib/errors/handlers.ts`
- [ ] Implement error handling utilities
- [ ] Add error logging

#### handlers.ts
```typescript
import { ErrorCode, type ErrorResponse } from '@/lib/types/responses';
import { ZodError } from 'zod';

/**
 * Create standardized error response
 */
export function createErrorResponse(
  message: string,
  code: ErrorCode = ErrorCode.INTERNAL_ERROR,
  details?: unknown
): ErrorResponse {
  return {
    success: false,
    error: {
      message,
      code,
      details,
    },
  };
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(error: ZodError): ErrorResponse {
  return createErrorResponse(
    'Validation failed',
    ErrorCode.VALIDATION_ERROR,
    error.format()
  );
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: unknown): ErrorResponse {
  // Log error
  console.error('[DB Error]:', error);

  // Check for specific error types
  if (error instanceof Error) {
    if (error.message.includes('duplicate key')) {
      return createErrorResponse(
        'Record already exists',
        ErrorCode.DUPLICATE_ENTRY
      );
    }

    if (error.message.includes('not found')) {
      return createErrorResponse(
        'Record not found',
        ErrorCode.NOT_FOUND
      );
    }
  }

  return createErrorResponse(
    'Database operation failed',
    ErrorCode.DATABASE_ERROR
  );
}

/**
 * Handle unknown errors
 */
export function handleUnknownError(error: unknown): ErrorResponse {
  console.error('[Unknown Error]:', error);

  if (error instanceof Error) {
    return createErrorResponse(
      error.message,
      ErrorCode.UNKNOWN_ERROR
    );
  }

  return createErrorResponse(
    'An unexpected error occurred',
    ErrorCode.UNKNOWN_ERROR
  );
}
```

### Step 4: Update Server Actions (0.3 יום)
- [ ] Update podcast actions with validation
- [ ] Update episode actions with validation
- [ ] Standardize error responses
- [ ] Add try-catch blocks

#### Example: podcast/create.ts
```typescript
'use server';

import { createPodcastSchema } from '@/lib/validation/schemas';
import { createErrorResponse, handleValidationError, handleDatabaseError } from '@/lib/errors';
import { podcastsApi } from '@/lib/db/api';
import type { ActionResponse } from '@/lib/types/responses';

export async function createPodcast(input: unknown): Promise<ActionResponse<Podcast>> {
  try {
    // Validate input
    const result = createPodcastSchema.safeParse(input);

    if (!result.success) {
      return handleValidationError(result.error);
    }

    // Create podcast
    const podcast = await podcastsApi.createPodcast(result.data);

    return {
      success: true,
      data: podcast,
    };

  } catch (error) {
    return handleDatabaseError(error);
  }
}
```

### Step 5: Update Error Pages (0.1 יום)
- [ ] Review error.tsx files
- [ ] Standardize error display
- [ ] Add error codes to UI

### Step 6: Testing (0.2 יום)
- [ ] Test validation with invalid inputs
- [ ] Test error responses
- [ ] Test error pages
- [ ] Verify logging

---

## ✅ Acceptance Criteria

### Standards:
- [ ] All server actions return ActionResponse<T>
- [ ] All inputs validated with Zod
- [ ] Consistent error codes
- [ ] Proper error logging

### Type Safety:
- [ ] No `any` types
- [ ] Proper type inference
- [ ] Error responses typed

### User Experience:
- [ ] Clear error messages
- [ ] Validation feedback
- [ ] Error pages work

---

## 🧪 Testing Checklist

```typescript
// Validation Tests
✓ Invalid input → validation error
✓ Missing required → validation error
✓ Type mismatch → validation error

// Error Handling Tests
✓ DB error → proper error response
✓ Auth error → proper error response
✓ Unknown error → proper error response

// User Feedback Tests
✓ Form validation → displays errors
✓ Server error → displays error page
✓ Error codes → user-friendly messages
```

---

## 📊 Success Metrics

### Before → After:
- **Error Patterns**: Inconsistent → Unified
- **Validation**: Ad-hoc → Zod schemas
- **Type Safety**: Partial → Complete
- **Logging**: Scattered → Centralized

---

## 🚨 הערות חשובות

### Breaking Changes:
⚠️ **Server Action Responses** - החזרים משתנים מ-throw ל-ActionResponse

### Migration:
```typescript
// Old
try {
  await updatePodcast(id, data);
} catch (error) {
  toast.error('Failed');
}

// New
const result = await updatePodcast(id, data);
if (!result.success) {
  toast.error(result.error.message);
}
```

---

## 🔗 קישורים נוספים

- [Zod Documentation](https://zod.dev/)
- [Error Handling Best Practices](https://www.builder.io/blog/errors)

---

**Phase Complete!** Return to: [Phase 1 README](./README.md)

---

**Updated:** 2025-01-15
**Status:** 📝 Planning → 🚀 Ready to Execute
