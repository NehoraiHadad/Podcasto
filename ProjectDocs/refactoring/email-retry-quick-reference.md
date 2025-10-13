# Email Retry Quick Reference

## TL;DR

Email sending now automatically retries transient failures (network issues, throttling) with exponential backoff. No code changes needed - it just works!

---

## Retry Configuration

```typescript
DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,      // Try 3 times total
  baseDelayMs: 1000,   // Start with 1s delay
  maxDelayMs: 10000,   // Cap at 10s delay
}
```

**Retry Timing**:
- Attempt 1: Immediate
- Attempt 2: Wait 1 second
- Attempt 3: Wait 2 seconds

---

## What Gets Retried?

### ✅ Retryable (Automatic Retry)

- Throttling errors (`ThrottlingException`, `Rate exceeded`)
- Network errors (`ECONNRESET`, `ETIMEDOUT`, `ENOTFOUND`)
- Service unavailable (`503`, `Service unavailable`)
- Temporary failures (`Connection refused`, `Timeout`)

### ❌ Non-Retryable (Fail Immediately)

- Invalid email addresses (`ValidationError`)
- Rejected content (`MessageRejected`)
- Authentication failures (`AccessDeniedException`)
- Malformed requests (`InvalidParameterValue`)

---

## Usage Examples

### Basic Usage (Already Implemented)

```typescript
// In batch-sender.ts - already using retry
const response = await withRetry(
  () => sesClient.send(command),
  DEFAULT_RETRY_CONFIG,
  `${logPrefix}[RETRY]`
);
```

### Custom Retry Config

```typescript
import { withRetry } from './retry-utils';

// More aggressive retries
const response = await withRetry(
  () => someAsyncOperation(),
  {
    maxAttempts: 5,
    baseDelayMs: 500,
    maxDelayMs: 30000,
  },
  '[MY-OPERATION]'
);
```

### Check If Error Is Retryable

```typescript
import { isRetryableError } from './retry-utils';

try {
  await sendEmail();
} catch (error) {
  if (isRetryableError(error)) {
    console.log('Transient error, retry would help');
  } else {
    console.log('Permanent error, retry would not help');
  }
}
```

### Get Retry Metadata

```typescript
import { withRetryResult } from './retry-utils';

const result = await withRetryResult(
  () => sendEmail(),
  DEFAULT_RETRY_CONFIG
);

if (result.success) {
  console.log(`Succeeded after ${result.attempts} attempts`);
  console.log('Data:', result.data);
} else {
  console.error(`Failed after ${result.attempts} attempts`);
  console.error('Error:', result.error);
}
```

---

## Log Examples

### Success (First Try)
```
[Batch 1] Sending bulk email to 50 recipients
[Batch 1] Successfully sent to user@example.com
```

### Success (After Retry)
```
[Batch 1] Sending bulk email to 50 recipients
[Batch 1][RETRY] Attempt 1/3 failed. Retrying in 1000ms...
[Batch 1][RETRY] Operation succeeded on attempt 2/3
[Batch 1] Successfully sent to user@example.com
```

### Failure (All Retries Exhausted)
```
[Batch 1] Sending bulk email to 50 recipients
[Batch 1][RETRY] Attempt 1/3 failed. Retrying in 1000ms...
[Batch 1][RETRY] Attempt 2/3 failed. Retrying in 2000ms...
[Batch 1][RETRY] All attempts exhausted: ThrottlingException
[Batch 1] Bulk send failed for entire batch
```

### Non-Retryable Error
```
[Batch 1] Sending bulk email to 50 recipients
[Batch 1][RETRY] Non-retryable error: ValidationError: Invalid email
[Batch 1] Bulk send failed for entire batch
```

---

## Troubleshooting

### "All attempts exhausted"

**Cause**: SES is throttling or service is down
**Solution**: Check AWS Service Health, verify sending limits

### "Non-retryable error"

**Cause**: Permanent failure (bad email, rejected content)
**Solution**: Fix the underlying issue (validate emails, check content)

### High retry rate

**Cause**: Approaching SES rate limits
**Solution**: Reduce sending rate, increase batch delays

---

## Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `retry-utils.ts` | Retry logic utilities | 118 |
| `batch-sender.ts` | Email batch sender (uses retry) | 106 |
| `retry-utils.test.ts` | Retry behavior tests | 105 |

---

## Key Functions

```typescript
// Wrap operation with retry
withRetry<T>(operation, config?, logPrefix?): Promise<T>

// Check if error should be retried
isRetryableError(error): boolean

// Wrap operation and get metadata
withRetryResult<T>(operation, config?, logPrefix?): Promise<RetryResult & { data?: T }>
```

---

## Performance Impact

| Scenario | Added Time | Success Rate |
|----------|-----------|--------------|
| Success (1st try) | 0ms | Same |
| Success (2nd try) | ~1.2s | Much higher |
| Success (3rd try) | ~3.2s | Much higher |
| All retries fail | ~3.6s | Same (but tried everything) |

**Trade-off**: Small delay in failure cases, significantly higher overall success rate.

---

## Testing

```bash
# Run retry tests
npm test src/lib/services/email/__tests__/retry-utils.test.ts

# Check retry logs in production
grep "\[RETRY\]" logs/production.log

# Count successful retries
grep "succeeded on attempt [2-3]" logs/production.log | wc -l
```

---

## Configuration Reference

```typescript
interface RetryConfig {
  maxAttempts: number;   // How many times to try (1 = no retry)
  baseDelayMs: number;   // Starting delay in milliseconds
  maxDelayMs: number;    // Maximum delay cap in milliseconds
}
```

**Exponential Backoff Formula**:
```
delay = min(baseDelayMs × 2^(attempt-1), maxDelayMs)
```

**Examples** (with `baseDelayMs=1000`):
- Attempt 1 → 1000ms (1s)
- Attempt 2 → 2000ms (2s)
- Attempt 3 → 4000ms (4s)
- Attempt 4 → 8000ms (8s)
- Attempt 5+ → 10000ms (10s cap)

---

## Best Practices

1. ✅ Use `DEFAULT_RETRY_CONFIG` unless you have specific needs
2. ✅ Always include a log prefix for debugging
3. ✅ Let `isRetryableError()` classify errors (don't override)
4. ✅ Monitor retry rates in production
5. ❌ Don't retry operations that modify data (unless idempotent)
6. ❌ Don't use infinite retries (`maxAttempts` must be finite)
7. ❌ Don't set `baseDelayMs` too low (avoid hammering services)

---

## When to Use

### ✅ Good Use Cases

- AWS API calls (SES, S3, SQS)
- Network requests to external services
- Database operations with connection issues
- File uploads with network dependency

### ❌ Bad Use Cases

- Non-idempotent operations (e.g., creating unique records)
- User-facing synchronous operations (adds delay)
- Operations with strict time requirements
- Local operations (no network involved)

---

## Support

**Documentation**: See `email-retry-implementation-report.md` for full details
**Tests**: `/src/lib/services/email/__tests__/retry-utils.test.ts`
**Questions**: Check CloudWatch logs for retry patterns
