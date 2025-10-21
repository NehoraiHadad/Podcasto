# Cost Tracking Integration Contract

**Version:** 1.0
**Date:** 2025-01-21
**Purpose:** Define the standard interface and expectations for cost tracking across all services

---

## Core Interface

### trackCostEvent() Function

**Location:** `src/lib/services/cost-tracker.ts`

**Signature:**
```typescript
interface TrackCostEventParams {
  episodeId?: string;
  podcastId?: string;
  eventType: CostEventType;
  service: CostService;
  quantity: number;
  unit: CostUnit;
  metadata?: CostEventMetadata;
}

function trackCostEvent(params: TrackCostEventParams): Promise<{
  success: boolean;
  eventId?: string;
  totalCostUsd?: number;
  error?: string;
}>
```

**Return Value:**
- `success`: Boolean indicating if event was logged
- `eventId`: UUID of created event (if successful)
- `totalCostUsd`: Calculated cost (quantity × unit_cost)
- `error`: Error message (if failed)

---

## Standard Parameters

### episodeId (optional)
- **Type:** `string` (UUID)
- **When to provide:** When operation is associated with a specific episode
- **When to omit:** System-level operations (e.g., scheduled jobs)

### podcastId (optional)
- **Type:** `string` (UUID)
- **When to provide:** When operation is associated with a podcast but not a specific episode
- **When to omit:** Episode-level operations (will be inferred from episodeId)

### eventType (required)
- **Type:** `'ai_api_call' | 'lambda_execution' | 's3_operation' | 'ses_email' | 'sqs_message' | 'storage_usage'`
- **Purpose:** Categorize the type of operation
- **Usage:**
  - `'ai_api_call'`: Google Gemini API calls
  - `'lambda_execution'`: AWS Lambda function executions
  - `'s3_operation'`: AWS S3 operations (PUT, GET, DELETE)
  - `'ses_email'`: AWS SES email sends
  - `'sqs_message'`: AWS SQS queue messages
  - `'storage_usage'`: Ongoing storage costs

### service (required)
- **Type:** `'gemini_text' | 'gemini_image' | 'gemini_tts' | 'lambda_audio_generation' | ... (see CostService type)`
- **Purpose:** Identify the specific service
- **Mapping:**
  - Gemini: `'gemini_text'`, `'gemini_image'`, `'gemini_tts'`
  - Lambda: `'lambda_audio_generation'`, `'lambda_telegram'`, `'lambda_script_preprocessor'`
  - S3: `'s3_put'`, `'s3_get'`, `'s3_delete'`, `'s3_storage'`
  - SES: `'ses'`
  - SQS: `'sqs'`

### quantity (required)
- **Type:** `number` (decimal)
- **Purpose:** Amount of resource consumed
- **Units per service:**
  - Gemini text/TTS: Token count (input + output)
  - Gemini image: Image count (usually 1)
  - Lambda: GB-seconds (duration × memory_gb)
  - S3 PUT/GET/DELETE: Request count (usually 1)
  - S3 Storage: GB-months (size × days/30)
  - SES: Email count
  - SQS: Message count

### unit (required)
- **Type:** `'tokens' | 'images' | 'mb' | 'gb' | 'emails' | 'requests' | 'gb_seconds'`
- **Purpose:** Unit of measurement for quantity
- **Must match quantity:**
  - `tokens` for AI token usage
  - `images` for image generation
  - `emails` for email sends
  - `requests` for API requests
  - `gb_seconds` for Lambda execution
  - `mb` or `gb` for storage

### metadata (optional)
- **Type:** `CostEventMetadata` (flexible JSONB object)
- **Purpose:** Capture service-specific details
- **See metadata standards below**

---

## Metadata Standards by Service

### Gemini Text (`gemini_text`)
```typescript
{
  model: 'gemini-2.0-flash',
  operation: 'generateText' | 'generateSummary' | 'generateTitle',
  input_tokens: number,
  output_tokens: number,
  retry_count?: number,
  duration_ms?: number
}
```

### Gemini Image (`gemini_image`)
```typescript
{
  model: 'gemini-2.5-flash-image',
  operation: 'generateImage' | 'enhanceImage',
  resolution?: string,  // e.g., '1024x1024'
  retry_count?: number,
  duration_ms?: number
}
```

### Gemini TTS (`gemini_tts`)
```typescript
{
  model: 'gemini-2.5-pro-preview-tts',
  operation: 'generateAudio',
  input_tokens: number,
  output_tokens: number,
  chunk_number?: number,
  retry_count?: number,
  duration_ms?: number
}
```

### Lambda Execution (`lambda_*`)
```typescript
{
  function_name: string,
  duration_seconds: number,
  memory_mb: number,
  region?: string
}
```

### S3 Operations (`s3_put`, `s3_get`, `s3_delete`)
```typescript
{
  operation: 'PUT' | 'GET' | 'DELETE',
  s3_key: string,
  file_size_mb?: number,
  content_type?: string,
  region?: string
}
```

### S3 Storage (`s3_storage`)
```typescript
{
  operation: 'STORAGE',
  file_size_mb: number,
  days_stored: number,  // for prorated calculation
  s3_key: string
}
```

### SES Email (`ses`)
```typescript
{
  template: string,
  batch_size: number,
  success_count: number,
  failed_count?: number,
  region?: string
}
```

### SQS Messages (`sqs`)
```typescript
{
  queue_url: string,
  message_count: number,
  region?: string
}
```

---

## Error Handling Pattern

### Principle: Never Break Main Functionality

Cost tracking must NEVER cause the main operation to fail. If cost tracking fails, log the error and continue.

### Standard Pattern:
```typescript
try {
  // 1. Perform billable operation
  const result = await billableOperation();

  // 2. Track cost (with try/catch)
  try {
    await trackCostEvent({
      episodeId: id,
      eventType: 'ai_api_call',
      service: 'gemini_text',
      quantity: result.usageMetadata.totalTokenCount,
      unit: 'tokens',
      metadata: {
        model: 'gemini-2.0-flash',
        input_tokens: result.usageMetadata.promptTokenCount,
        output_tokens: result.usageMetadata.candidatesTokenCount
      }
    });
  } catch (costError) {
    console.error('Cost tracking failed:', costError);
    // Don't throw - just log
  }

  // 3. Return result
  return result;
} catch (error) {
  // Main operation error - throw as normal
  throw error;
}
```

### Alternative Pattern (Non-Blocking):
```typescript
// For non-critical paths, track async without awaiting
billableOperation().then(async (result) => {
  trackCostEvent({ ... }).catch(console.error);
  return result;
});
```

---

## Token Counting Strategy (Gemini)

### Primary Method: Use usageMetadata (99% Accurate)

```typescript
const response = await model.generateContent(prompt);

// ✅ Correct - Use API's token count
const tokens = response.usageMetadata.totalTokenCount;
const inputTokens = response.usageMetadata.promptTokenCount;
const outputTokens = response.usageMetadata.candidatesTokenCount;

await trackCostEvent({
  service: 'gemini_text',
  quantity: tokens,
  unit: 'tokens',
  metadata: {
    input_tokens: inputTokens,
    output_tokens: outputTokens
  }
});
```

### Fallback Method: Estimation (85% Accurate)

Only use if `usageMetadata` is unavailable:

```typescript
// ❌ Less accurate - avoid if possible
const estimatedTokens = Math.ceil(text.length / 4);
```

---

## Testing & Validation

### Required Tests Per Integration:

1. **Success Case:**
   - Perform operation
   - Verify cost event created in database
   - Verify quantity matches actual usage
   - Verify metadata captured correctly

2. **Cost Tracking Failure:**
   - Mock database error
   - Verify main operation still succeeds
   - Verify error logged to console

3. **Missing Optional Parameters:**
   - Track event without episodeId
   - Track event without podcastId
   - Verify accepted without error

4. **Token Accuracy (AI only):**
   - Compare tracked tokens to API usageMetadata
   - Verify <1% difference

---

## Checklist for Implementers

Before marking instrumentation complete:

- [ ] trackCostEvent() imported from correct path
- [ ] All required parameters provided
- [ ] eventType matches operation category
- [ ] service identifier is correct
- [ ] quantity uses actual measured value (not estimate)
- [ ] unit matches quantity type
- [ ] metadata includes all standard fields
- [ ] Error handling follows non-breaking pattern
- [ ] Token counting uses usageMetadata (AI operations)
- [ ] File size captured (S3 operations)
- [ ] Success count used (SES operations)
- [ ] Tested with database unavailable
- [ ] Tested with missing optional parameters

---

## Contact & Questions

If unclear about implementation:
1. Check examples in Build Notes (`cost-monitoring_phase-2_nextjs-instrumentation.md`)
2. Review existing implementation in `src/lib/services/cost-tracker.ts`
3. Consult integration specifications in `ProjectDocs/specs/`

**Maintainer:** Phase 2 implementation team
**Last Updated:** 2025-01-21
