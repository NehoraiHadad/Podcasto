# AWS Services Instrumentation Specification

**Agent:** backend-architect
**Phase:** 2 - Next.js Instrumentation
**Priority:** High
**Dependencies:** Phase 1 complete, Integration Contract defined

---

## Objective

Instrument all AWS service operations (S3, SES, SQS) in the Next.js application to track costs with accurate operation counts and metadata.

---

## Files to Modify

### 1. `src/lib/services/s3-service.ts`

**Current Functionality:**
- S3 operations: upload, download, delete, list
- Functions: `uploadImageToS3()`, `getFileContent()`, `deleteFile()`, `deleteAllEpisodeFiles()`, `listEpisodeFiles()`

---

#### Function: `uploadImageToS3()`

**Current Signature:**
```typescript
export async function uploadImageToS3({
  imageBuffer,
  key,
  contentType
}: {
  imageBuffer: Buffer;
  key: string;
  contentType?: string;
})
```

**Required Changes:**
1. Add optional `episodeId` and `podcastId` parameters
2. Track S3 PUT operation after successful upload
3. Capture file size in MB

**Implementation:**
```typescript
import { trackCostEvent } from '@/lib/services/cost-tracker';

export async function uploadImageToS3({
  imageBuffer,
  key,
  contentType = 'image/jpeg',
  episodeId,
  podcastId
}: {
  imageBuffer: Buffer;
  key: string;
  contentType?: string;
  episodeId?: string;
  podcastId?: string;
}) {
  try {
    // Existing upload logic
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: contentType
    });

    await s3Client.send(command);

    // Calculate file size in MB
    const fileSizeMB = imageBuffer.length / (1024 * 1024);

    // NEW: Track S3 PUT cost
    try {
      await trackCostEvent({
        episodeId,
        podcastId,
        eventType: 's3_operation',
        service: 's3_put',
        quantity: 1,
        unit: 'requests',
        metadata: {
          operation: 'PUT',
          s3_key: key,
          file_size_mb: fileSizeMB,
          content_type: contentType,
          region: AWS_REGION
        }
      });
    } catch (costError) {
      console.error('Cost tracking failed for S3 PUT:', costError);
    }

    return { success: true, key };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

#### Function: `getFileContent()`

**Current Functionality:**
- Downloads file from S3
- Returns file content or signed URL

**Required Changes:**
1. Add optional `episodeId` and `podcastId` parameters
2. Track S3 GET operation after successful download

**Implementation:**
```typescript
export async function getFileContent({
  key,
  episodeId,
  podcastId
}: {
  key: string;
  episodeId?: string;
  podcastId?: string;
}) {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    });

    const response = await s3Client.send(command);
    const content = await response.Body.transformToString();

    // NEW: Track S3 GET cost
    try {
      await trackCostEvent({
        episodeId,
        podcastId,
        eventType: 's3_operation',
        service: 's3_get',
        quantity: 1,
        unit: 'requests',
        metadata: {
          operation: 'GET',
          s3_key: key,
          file_size_mb: response.ContentLength / (1024 * 1024),
          content_type: response.ContentType,
          region: AWS_REGION
        }
      });
    } catch (costError) {
      console.error('Cost tracking failed for S3 GET:', costError);
    }

    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

#### Function: `deleteFile()`

**Current Functionality:**
- Deletes single file from S3

**Required Changes:**
1. Add optional `episodeId` and `podcastId` parameters
2. Track S3 DELETE operation

**Implementation:**
```typescript
export async function deleteFile({
  key,
  episodeId,
  podcastId
}: {
  key: string;
  episodeId?: string;
  podcastId?: string;
}) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);

    // NEW: Track S3 DELETE cost
    try {
      await trackCostEvent({
        episodeId,
        podcastId,
        eventType: 's3_operation',
        service: 's3_delete',
        quantity: 1,
        unit: 'requests',
        metadata: {
          operation: 'DELETE',
          s3_key: key,
          region: AWS_REGION
        }
      });
    } catch (costError) {
      console.error('Cost tracking failed for S3 DELETE:', costError);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

#### Function: `deleteAllEpisodeFiles()`

**Current Functionality:**
- Deletes multiple files for an episode
- Lists files first, then deletes each

**Required Changes:**
1. Track each DELETE operation
2. Use batch tracking for performance

**Implementation:**
```typescript
import { trackCostEventBatch } from '@/lib/services/cost-tracker';

export async function deleteAllEpisodeFiles({
  episodeId,
  podcastId
}: {
  episodeId: string;
  podcastId?: string;
}) {
  try {
    // List files
    const files = await listEpisodeFiles({ episodeId });

    // Delete each file
    const deletePromises = files.map(file => {
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: file.key
      });
      return s3Client.send(command);
    });

    await Promise.all(deletePromises);

    // NEW: Track all DELETE operations in batch
    try {
      const costEvents = files.map(file => ({
        episodeId,
        podcastId,
        eventType: 's3_operation' as const,
        service: 's3_delete' as const,
        quantity: 1,
        unit: 'requests' as const,
        metadata: {
          operation: 'DELETE',
          s3_key: file.key,
          region: AWS_REGION
        }
      }));

      await trackCostEventBatch({ events: costEvents });
    } catch (costError) {
      console.error('Cost tracking failed for bulk S3 DELETE:', costError);
    }

    return { success: true, deletedCount: files.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

### 2. `src/lib/services/email/batch-sender.ts`

**Current Functionality:**
- `sendBulkBatch()` - Sends bulk emails via SES
- Uses `SendBulkTemplatedEmailCommand`
- Batch size: 50 recipients per batch

---

#### Function: `sendBulkBatch()`

**Required Changes:**
1. Add `episodeId` and `podcastId` to function parameters
2. Track SES cost based on **successful** email sends (not attempts)
3. Capture batch size, success count, failure count

**Implementation:**
```typescript
import { trackCostEvent } from '@/lib/services/cost-tracker';

export async function sendBulkBatch({
  destinations,
  templateData,
  episodeId,
  podcastId
}: {
  destinations: Array<{ email: string; data: any }>;
  templateData: any;
  episodeId?: string;
  podcastId?: string;
}) {
  try {
    const command = new SendBulkTemplatedEmailCommand({
      Source: AWS_SES_FROM_EMAIL,
      Template: 'podcasto-new-episode-v1',
      Destinations: destinations.map(d => ({
        Destination: { ToAddresses: [d.email] },
        ReplacementTemplateData: JSON.stringify(d.data)
      })),
      DefaultTemplateData: JSON.stringify(templateData)
    });

    const response = await sesClient.send(command);

    // Count successful sends
    const successCount = response.Status.filter(
      s => s.Status === 'Success'
    ).length;
    const failedCount = destinations.length - successCount;

    // NEW: Track SES cost (only successful emails)
    try {
      await trackCostEvent({
        episodeId,
        podcastId,
        eventType: 'ses_email',
        service: 'ses',
        quantity: successCount,  // Only count successful sends
        unit: 'emails',
        metadata: {
          template: 'podcasto-new-episode-v1',
          batch_size: destinations.length,
          success_count: successCount,
          failed_count: failedCount,
          region: AWS_SES_REGION
        }
      });
    } catch (costError) {
      console.error('Cost tracking failed for SES:', costError);
    }

    return { success: true, sent: successCount, failed: failedCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

#### Function: `sendBulkEmailsToSubscribers()` (in `email-sender.ts`)

**Current Functionality:**
- Orchestrates bulk email sending
- Batches subscribers into groups of 50
- Calls `sendBulkBatch()` for each batch

**Required Changes:**
1. Pass `episodeId` and `podcastId` to `sendBulkBatch()`
2. No direct cost tracking needed (handled by sendBulkBatch)

**Implementation:**
```typescript
export async function sendBulkEmailsToSubscribers({
  episodeId,
  podcastId,
  subscribers,
  episodeData
}: {
  episodeId: string;
  podcastId: string;
  subscribers: Array<{ email: string; ... }>;
  episodeData: any;
}) {
  // Batch subscribers
  const batches = chunk(subscribers, MAX_RECIPIENTS_PER_BATCH);

  // Send each batch
  for (const batch of batches) {
    await sendBulkBatch({
      destinations: batch,
      templateData: episodeData,
      episodeId,  // NEW: Pass through
      podcastId   // NEW: Pass through
    });
  }

  return { success: true };
}
```

---

### 3. `src/app/api/episodes/generate-audio/helpers.ts`

**Current Functionality:**
- `sendEpisodeToSQS()` - Send single episode to SQS queue
- `sendEpisodesToSQS()` - Send multiple episodes to queue

---

#### Function: `sendEpisodeToSQS()`

**Required Changes:**
1. Track SQS message send after successful operation

**Implementation:**
```typescript
import { trackCostEvent } from '@/lib/services/cost-tracker';

export async function sendEpisodeToSQS({
  episodeId,
  podcastId,
  s3Path
}: {
  episodeId: string;
  podcastId: string;
  s3Path: string;
}) {
  try {
    const command = new SendMessageCommand({
      QueueUrl: AUDIO_GENERATION_QUEUE_URL,
      MessageBody: JSON.stringify({
        episode_id: episodeId,
        podcast_id: podcastId,
        s3_path: s3Path,
        timestamp: new Date().toISOString()
      })
    });

    await sqsClient.send(command);

    // NEW: Track SQS cost
    try {
      await trackCostEvent({
        episodeId,
        podcastId,
        eventType: 'sqs_message',
        service: 'sqs',
        quantity: 1,
        unit: 'requests',
        metadata: {
          queue_url: AUDIO_GENERATION_QUEUE_URL,
          message_count: 1,
          region: AWS_REGION
        }
      });
    } catch (costError) {
      console.error('Cost tracking failed for SQS:', costError);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

#### Function: `sendEpisodesToSQS()`

**Required Changes:**
1. Track each SQS message
2. Use batch tracking for performance

**Implementation:**
```typescript
import { trackCostEventBatch } from '@/lib/services/cost-tracker';

export async function sendEpisodesToSQS({
  episodes
}: {
  episodes: Array<{ id: string; podcastId: string; s3Path: string }>;
}) {
  try {
    // Send each message
    const sendPromises = episodes.map(ep =>
      sendEpisodeToSQS({
        episodeId: ep.id,
        podcastId: ep.podcastId,
        s3Path: ep.s3Path
      })
    );

    await Promise.all(sendPromises);

    // Note: Each sendEpisodeToSQS() already tracks its cost
    // No additional tracking needed here

    return { success: true, sent: episodes.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

## Parameter Propagation

### Critical: episodeId and podcastId Flow

Many AWS operations don't currently receive episode/podcast context. You'll need to:

1. **Trace caller chain** to find where episodeId/podcastId are available
2. **Add parameters** to intermediate functions
3. **Pass through** to instrumented functions

**Example Flow:**
```
Server Action (has episodeId)
  → uploadImageToS3() (needs episodeId parameter)
    → trackCostEvent() (receives episodeId)
```

**Common Callers:**
- `src/lib/actions/episode/image/generate-image.ts`
- `src/lib/actions/episode/core-actions.ts`
- `src/lib/services/post-processing.ts`
- `src/app/api/episodes/*/route.ts`

---

## Testing Checklist

### S3 Operations:
- [ ] Upload image → cost event created
- [ ] Download file → cost event created
- [ ] Delete file → cost event created
- [ ] Bulk delete → multiple cost events created
- [ ] File size captured correctly in metadata
- [ ] S3 key captured in metadata

### SES Operations:
- [ ] Send bulk emails → cost event created
- [ ] Quantity matches successful sends (not attempts)
- [ ] Failed emails not counted in cost
- [ ] Template name captured in metadata
- [ ] Batch size captured in metadata

### SQS Operations:
- [ ] Send message → cost event created
- [ ] Send multiple messages → multiple events created
- [ ] Queue URL captured in metadata
- [ ] Message count accurate

### Error Handling:
- [ ] S3 operation fails → no cost event (correct)
- [ ] Cost tracking fails → operation still succeeds
- [ ] Error logged to console

---

## Success Criteria

✅ All S3 operations instrumented (PUT, GET, DELETE)
✅ SES email sends tracked (successful only)
✅ SQS message sends tracked
✅ File sizes captured for S3 operations
✅ Batch operations use trackCostEventBatch()
✅ No breaking changes to existing functionality
✅ Error handling prevents tracking failures from breaking operations
✅ All metadata fields captured per standards

---

## Notes & Considerations

1. **S3 Storage Costs:**
   - Not tracking ongoing storage in this phase
   - Will be added in Phase 4 (aggregation jobs)
   - Current focus: Operation costs (PUT/GET/DELETE)

2. **SES Rate Limiting:**
   - Existing rate limiter may affect batch sends
   - Cost tracking should reflect actual sends, not queued

3. **File Size Precision:**
   - Convert bytes to MB with precision: `bytes / (1024 * 1024)`
   - Round to 4 decimal places for accuracy

4. **Bulk Operations:**
   - Use `trackCostEventBatch()` for 10+ operations
   - Reduces database roundtrips

5. **Region Handling:**
   - Capture AWS_REGION in metadata
   - Future: Support region-specific pricing

---

**Agent Assignment:** backend-architect
**Estimated Effort:** 3-5 hours
**Dependencies:** Integration contract, pricing constants, cost-tracker service
**Deliverable:** All AWS services instrumented with cost tracking
