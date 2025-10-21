# Gemini AI Instrumentation Specification

**Agent:** senior-frontend-dev
**Phase:** 2 - Next.js Instrumentation
**Priority:** High
**Dependencies:** Phase 1 complete, Integration Contract defined

---

## Objective

Instrument all Gemini AI API calls in the Next.js application to track costs with 99% accuracy using Google's `usageMetadata`.

---

## Files to Modify

### 1. `src/lib/ai/providers/gemini-text-generation.ts`

**Current Functionality:**
- Exports `generateText()`, `generateTitle()`, `generateSummary()`
- Uses Google Gemini 2.0 Flash for text generation
- Returns generated text

**Required Changes:**
1. Import `trackCostEvent` from `@/lib/services/cost-tracker`
2. After each API call, extract `usageMetadata` from response
3. Call `trackCostEvent()` with accurate token counts
4. Handle errors without breaking text generation

**Implementation Pattern:**
```typescript
import { trackCostEvent } from '@/lib/services/cost-tracker';

export async function generateText({
  prompt,
  episodeId,
  podcastId
}: {
  prompt: string;
  episodeId?: string;
  podcastId?: string;
}) {
  try {
    // Existing API call
    const response = await model.generateContent(prompt);
    const text = response.text();

    // NEW: Track cost using usageMetadata
    try {
      await trackCostEvent({
        episodeId,
        podcastId,
        eventType: 'ai_api_call',
        service: 'gemini_text',
        quantity: response.usageMetadata.totalTokenCount,
        unit: 'tokens',
        metadata: {
          model: 'gemini-2.0-flash',
          operation: 'generateText',
          input_tokens: response.usageMetadata.promptTokenCount,
          output_tokens: response.usageMetadata.candidatesTokenCount
        }
      });
    } catch (costError) {
      console.error('Cost tracking failed for generateText:', costError);
    }

    return { success: true, text };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**Functions to Instrument:**
- ✅ `generateText()`
- ✅ `generateTitle()`
- ✅ `generateSummary()`
- ✅ Any other text generation functions

**Metadata Requirements:**
- `model`: `'gemini-2.0-flash'`
- `operation`: Function name (e.g., `'generateText'`, `'generateTitle'`)
- `input_tokens`: From `response.usageMetadata.promptTokenCount`
- `output_tokens`: From `response.usageMetadata.candidatesTokenCount`

---

### 2. `src/lib/ai/providers/gemini.ts`

**Current Functionality:**
- Exports `generateTitleAndSummary()`
- Batch generation using Gemini 2.0 Flash
- Returns structured JSON with title + summary

**Required Changes:**
1. Track cost after `generateContent()` call
2. Use `usageMetadata` for token count
3. Handle batch generation appropriately

**Implementation Pattern:**
```typescript
export async function generateTitleAndSummary({
  transcript,
  episodeId,
  podcastId
}: {
  transcript: string;
  episodeId?: string;
  podcastId?: string;
}) {
  try {
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseSchema: schema,
        responseMimeType: 'application/json'
      }
    });

    // NEW: Track cost
    try {
      await trackCostEvent({
        episodeId,
        podcastId,
        eventType: 'ai_api_call',
        service: 'gemini_text',
        quantity: response.usageMetadata.totalTokenCount,
        unit: 'tokens',
        metadata: {
          model: 'gemini-2.0-flash',
          operation: 'generateTitleAndSummary',
          input_tokens: response.usageMetadata.promptTokenCount,
          output_tokens: response.usageMetadata.candidatesTokenCount
        }
      });
    } catch (costError) {
      console.error('Cost tracking failed:', costError);
    }

    const result = JSON.parse(response.text());
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

### 3. `src/lib/ai/providers/image-generator.ts`

**Current Functionality:**
- Exports `generateImage()`
- Uses Gemini 2.5 Flash Image
- Returns base64 image data
- Has retry logic (up to 3 retries)

**Required Changes:**
1. Track cost after successful image generation
2. Track quantity = 1 (one image per call)
3. Capture retry count in metadata

**Implementation Pattern:**
```typescript
export async function generateImage({
  prompt,
  episodeId,
  podcastId
}: {
  prompt: string;
  episodeId?: string;
  podcastId?: string;
}) {
  let retryCount = 0;

  try {
    // Existing retry logic
    const response = await generateWithRetry(prompt);
    const imageData = response.imageData;

    // NEW: Track cost
    try {
      await trackCostEvent({
        episodeId,
        podcastId,
        eventType: 'ai_api_call',
        service: 'gemini_image',
        quantity: 1,
        unit: 'images',
        metadata: {
          model: 'gemini-2.5-flash-image',
          operation: 'generateImage',
          retry_count: retryCount,
          resolution: '1024x1024' // if known
        }
      });
    } catch (costError) {
      console.error('Cost tracking failed for generateImage:', costError);
    }

    return { success: true, imageData };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**Special Considerations:**
- Track only successful generations (not failed retries)
- If retry logic exists, capture `retry_count` in metadata
- Each successful image = 1 unit (quantity = 1)

---

### 4. `src/lib/services/prompt-generator.ts`

**Current Functionality:**
- May call Gemini for prompt generation
- Or may use template-based generation

**Required Changes:**
1. Check if it makes direct Gemini API calls
2. If YES: Instrument with cost tracking
3. If NO: Cost tracked by underlying provider

**Decision Logic:**
```typescript
// If prompt-generator calls gemini-text-generation:
import { generateText } from '@/lib/ai/providers/gemini-text-generation';

// Then cost is automatically tracked by generateText()
// NO additional instrumentation needed

// If prompt-generator calls Gemini API directly:
const response = await model.generateContent(...);
// Then INSTRUMENT HERE following pattern above
```

---

### 5. `src/lib/services/podcast-image-analyzer.ts`

**Current Functionality:**
- `analyzeImage()` - Multimodal analysis using Gemini 2.5 Flash
- Takes image Buffer and returns analysis

**Required Changes:**
1. Track cost after `generateContent()` call
2. Use `usageMetadata` for token count
3. Note: Multimodal may have different pricing (check if applicable)

**Implementation Pattern:**
```typescript
export async function analyzeImage({
  imageBuffer,
  episodeId,
  podcastId
}: {
  imageBuffer: Buffer;
  episodeId?: string;
  podcastId?: string;
}) {
  try {
    const response = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      }]
    });

    // NEW: Track cost
    try {
      await trackCostEvent({
        episodeId,
        podcastId,
        eventType: 'ai_api_call',
        service: 'gemini_text', // or 'gemini_multimodal' if different pricing
        quantity: response.usageMetadata.totalTokenCount,
        unit: 'tokens',
        metadata: {
          model: 'gemini-2.5-flash',
          operation: 'analyzeImage',
          input_tokens: response.usageMetadata.promptTokenCount,
          output_tokens: response.usageMetadata.candidatesTokenCount
        }
      });
    } catch (costError) {
      console.error('Cost tracking failed:', costError);
    }

    const analysis = JSON.parse(response.text());
    return { success: true, analysis };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

### 6. `src/lib/services/image-generation.ts`

**Current Functionality:**
- `generateImagePrompt()` - Generate prompt using Gemini
- `generateImagePreview()` - Generate image preview
- May orchestrate calls to other providers

**Required Changes:**
1. If calls `generateText()` or `generateImage()` → Already tracked
2. If makes direct API calls → Instrument

**Pattern:**
```typescript
// If using existing providers:
import { generateText } from '@/lib/ai/providers/gemini-text-generation';
import { generateImage } from '@/lib/ai/providers/image-generator';

// Then cost is already tracked - NO changes needed

// If making direct API calls:
// Follow instrumentation pattern above
```

---

## Parameter Propagation

### Important: episodeId and podcastId

Many functions don't currently accept `episodeId` or `podcastId`. You'll need to:

1. **Add optional parameters** to function signatures
2. **Pass through** from callers
3. **Don't break** existing calls (make parameters optional)

**Example:**
```typescript
// Before:
export async function generateText({ prompt }: { prompt: string }) { ... }

// After:
export async function generateText({
  prompt,
  episodeId,
  podcastId
}: {
  prompt: string;
  episodeId?: string;  // NEW - optional
  podcastId?: string;  // NEW - optional
}) { ... }
```

**Callers will need updating:**
```typescript
// In server action or component:
const result = await generateText({
  prompt: 'Generate a title',
  episodeId: episode.id,  // Pass from context
  podcastId: episode.podcast_id
});
```

---

## Testing Checklist

### For Each Instrumented Function:

- [ ] Function still works without episodeId/podcastId
- [ ] Function works with episodeId/podcastId provided
- [ ] Cost event created in `cost_tracking_events` table
- [ ] Token count matches `usageMetadata` (within 1%)
- [ ] Metadata includes all required fields
- [ ] Cost tracking failure doesn't break AI operation
- [ ] Error logged to console on tracking failure

### Integration Test:

- [ ] Generate episode title
- [ ] Generate episode summary
- [ ] Generate episode image
- [ ] Check `cost_tracking_events` table for 3+ events
- [ ] Verify total tokens > 0
- [ ] Verify image count = 1
- [ ] Run `calculateEpisodeCost()` and verify aggregation works

---

## Success Criteria

✅ All Gemini API calls instrumented
✅ Token counts accurate (99% using usageMetadata)
✅ Image generation tracked (quantity = 1 per image)
✅ No breaking changes to existing functionality
✅ Error handling prevents cost tracking from breaking operations
✅ All metadata fields captured per standards
✅ Tests pass for all instrumented functions

---

## Notes & Considerations

1. **usageMetadata Availability:**
   - Confirm all Gemini SDK versions support usageMetadata
   - If unavailable in response, log warning and use estimate

2. **Multimodal Pricing:**
   - Image analysis may have different token pricing
   - Verify if separate service identifier needed

3. **Batch Operations:**
   - If generating multiple items in one API call, ensure correct token tracking

4. **Async Operations:**
   - Cost tracking should not delay user-facing operations
   - Consider fire-and-forget pattern for non-critical paths

5. **Backward Compatibility:**
   - All new parameters MUST be optional
   - Existing calls should work without modification

---

**Agent Assignment:** senior-frontend-dev
**Estimated Effort:** 4-6 hours
**Dependencies:** Integration contract, pricing constants
**Deliverable:** All Gemini providers instrumented with cost tracking
