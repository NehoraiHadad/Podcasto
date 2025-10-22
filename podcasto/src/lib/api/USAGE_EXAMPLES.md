# API Utilities - Usage Examples

This document provides practical examples of using the API utilities in Podcasto routes.

## Table of Contents

1. [Response Helpers](#response-helpers)
2. [Authentication Helpers](#authentication-helpers)
3. [Validation Helpers](#validation-helpers)
4. [Error Handling](#error-handling)

## Response Helpers

### Basic Success Response

```typescript
import { apiSuccess, apiError } from '@/lib/api';

export async function GET() {
  try {
    const episodes = await fetchEpisodes();
    return apiSuccess({ episodes, count: episodes.length });
  } catch (error) {
    return apiError(error, 500);
  }
}
```

### Custom Status Codes

```typescript
// Created (201)
return apiSuccess({ episodeId: newEpisode.id }, 201);

// Not Found (404)
return apiError('Episode not found', 404);

// Bad Request (400)
return apiError('Invalid episode ID', 400);
```

## Authentication Helpers

### CRON Job Authentication

```typescript
import { validateCronAuth, apiError, apiSuccess } from '@/lib/api';

export async function GET(request: NextRequest) {
  // Validate CRON secret
  const authResult = validateCronAuth(request);
  if (!authResult.valid) {
    return apiError(authResult.error || 'Unauthorized', 401);
  }

  // Proceed with CRON job logic
  const results = await processCronJob();
  return apiSuccess(results);
}
```

### Lambda Callback Authentication

```typescript
import { validateLambdaAuth, apiError } from '@/lib/api';

export async function POST(request: NextRequest) {
  // Validate Lambda callback secret
  const authResult = validateLambdaAuth(request);
  if (!authResult.valid) {
    return apiError(authResult.error || 'Unauthorized', 401);
  }

  // Process Lambda callback
  // ...
}
```

### Custom Bearer Token

```typescript
import { validateBearerToken, apiError } from '@/lib/api';

export async function POST(request: NextRequest) {
  const customSecret = process.env.CUSTOM_API_SECRET;
  if (!customSecret) {
    return apiError('API authentication not configured', 500);
  }

  const authResult = validateBearerToken(request, customSecret);
  if (!authResult.valid) {
    return apiError(authResult.error || 'Unauthorized', 401);
  }

  // Proceed with authenticated logic
  // ...
}
```

## Validation Helpers

### JSON Body Validation

```typescript
import { validateJsonBody, apiError, apiSuccess } from '@/lib/api';
import { z } from 'zod';

const episodeSchema = z.object({
  episodeId: z.string().uuid(),
  podcastId: z.string().uuid(),
  s3Path: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Validate request body
  const bodyResult = await validateJsonBody(request, episodeSchema);
  if (!bodyResult.success) {
    return apiError(bodyResult.error, 400);
  }

  const { episodeId, podcastId, s3Path } = bodyResult.data;

  // Use validated data
  await processEpisode(episodeId, podcastId, s3Path);
  return apiSuccess({ message: 'Episode queued' });
}
```

### Query Parameter Validation

```typescript
import { validateSearchParams, apiError } from '@/lib/api';
import { z } from 'zod';

const querySchema = z.object({
  episodeId: z.string().uuid().optional(),
  target: z.enum(['episode-checker', 'podcast-scheduler']).optional(),
});

export async function GET(request: NextRequest) {
  const paramsResult = validateSearchParams(request, querySchema);
  if (!paramsResult.success) {
    return apiError(paramsResult.error, 400);
  }

  const { episodeId, target } = paramsResult.data;

  // Use validated query params
  // ...
}
```

### Environment Variable Validation

```typescript
import { validateEnvVars, apiError } from '@/lib/api';

export async function POST(request: NextRequest) {
  // Validate required environment variables
  const envResult = validateEnvVars([
    'AWS_REGION',
    'S3_BUCKET_NAME',
    'SQS_QUEUE_URL',
  ]);

  if (!envResult.success) {
    return apiError(envResult.error, 500);
  }

  const { AWS_REGION, S3_BUCKET_NAME, SQS_QUEUE_URL } = envResult.data;

  // Use environment variables safely
  // ...
}
```

## Error Handling

### Basic Error Logging

```typescript
import { logError, apiError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    await performOperation();
  } catch (error) {
    logError('[EPISODE_GENERATION]', error, {
      episodeId: 'ep-123',
      userId: 'user-456',
    });
    return apiError(error, 500);
  }
}
```

### Error Type Detection

```typescript
import { getErrorType, logError, apiError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    await databaseOperation();
  } catch (error) {
    const errorType = getErrorType(error);

    if (errorType === 'database') {
      // Handle database errors specifically
      logError('[DATABASE]', error, { operation: 'insert' });
      return apiError('Database error occurred', 500);
    }

    return apiError(error, 500);
  }
}
```

### Retry Logic with Error Detection

```typescript
import { isRetryableError, getErrorMessage, logError } from '@/lib/api';

const MAX_RETRIES = 3;

async function fetchWithRetry(url: string, retries = 0): Promise<Response> {
  try {
    return await fetch(url);
  } catch (error) {
    if (isRetryableError(error) && retries < MAX_RETRIES) {
      logError('[FETCH]', error, { url, retryCount: retries });
      await new Promise((resolve) => setTimeout(resolve, 1000 * (retries + 1)));
      return fetchWithRetry(url, retries + 1);
    }
    throw error;
  }
}
```

## Complete Example: CRON Job Route

```typescript
import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiError,
  validateCronAuth,
  validateSearchParams,
  logError,
  getErrorType,
} from '@/lib/api';
import { z } from 'zod';

const querySchema = z.object({
  episodeId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // 1. Validate CRON authentication
    const authResult = validateCronAuth(request);
    if (!authResult.valid) {
      return apiError(authResult.error || 'Unauthorized', 401);
    }

    // 2. Validate query parameters
    const paramsResult = validateSearchParams(request, querySchema);
    if (!paramsResult.success) {
      return apiError(paramsResult.error, 400);
    }

    const { episodeId } = paramsResult.data;

    // 3. Process episodes
    const results = episodeId
      ? await processSingleEpisode(episodeId)
      : await processBatchEpisodes();

    // 4. Return success
    return apiSuccess({
      processed: results.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // 5. Handle errors with logging
    const errorType = getErrorType(error);
    logError('[CRON_JOB]', error, { errorType });
    return apiError(error, 500);
  }
}
```

## Migration from Old Pattern

### Before (Inconsistent)

```typescript
// Old pattern - inconsistent response format
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await fetchData();
    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error?.toString() || 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### After (Using Utilities)

```typescript
// New pattern - consistent, DRY, type-safe
import { apiSuccess, apiError, validateCronAuth } from '@/lib/api';

export async function GET(request: NextRequest) {
  const authResult = validateCronAuth(request);
  if (!authResult.valid) {
    return apiError(authResult.error || 'Unauthorized', 401);
  }

  try {
    const data = await fetchData();
    return apiSuccess(data);
  } catch (error) {
    return apiError(error, 500);
  }
}
```

## Benefits

1. **Consistency**: All API routes return the same response format
2. **Type Safety**: Full TypeScript support with proper types
3. **DRY**: No duplicated authentication/validation logic
4. **Maintainability**: Changes to response format happen in one place
5. **Better Error Handling**: Structured error logging and categorization
6. **Documentation**: Clear JSDoc comments with usage examples
