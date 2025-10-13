# משימה 3.2: Split Image Actions (683 שורות → ~150 כל קובץ)

## מטרה
פיצול `actions/podcast/image-actions.ts` (683 שורות) ל-6 מודולים ממוקדים

## עדיפות: 🔴 גבוהה | זמן: 4 שעות | תחום: Server Actions (03)

---

## 📊 מצב נוכחי

### הקובץ הקיים
- **Path**: `src/lib/actions/podcast/image-actions.ts`
- **Size**: 683 שורות - גדול פי 4.5 מה-convention!
- **Functions**: 12 functions גדולים
- **Issues**:
  - ערבוב של concerns שונים
  - קוד חוזר (S3 upload logic)
  - קשה לנווט ול-debug

---

## 🎯 מבנה מוצע

```
actions/podcast/image/
├── generate-from-telegram.ts    (~150 שורות)
├── generate-from-file.ts        (~150 שורות)
├── generate-from-url.ts         (~150 שורות)
├── upload-to-s3.ts              (~100 שורות)
├── gallery-actions.ts           (~100 שורות)
├── shared-utils.ts              (~50 שורות)
└── index.ts                     (~20 שורות)
```

---

## 📚 דוקומנטציה

**Next.js Server Actions (2025)**
- https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- Best Practice: "Avoid embedding HTML or JSX inside actions"
- Security: "Treat Server Actions as public HTTP endpoints"

**Google Gemini API - Image Generation**
- https://ai.google.dev/gemini-api/docs/image-generation
- Gemini 2.5 Flash Image (aka "nano banana")
- Prompting: "Describe the scene, don't just list keywords"

**AWS S3 Presigned URLs**
- https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html
- Best for direct client uploads
- Security: Time-limited, limited permissions

---

## 📝 שלבי ביצוע מהירים

### 1. Create Shared Utilities (~30 min)

**File**: `shared-utils.ts`
```typescript
'use server';

import { requireAdmin } from '@/lib/actions/auth-actions';
import type { ImageActionResult } from './types';

export async function validateAdminAccess(): Promise<void> {
  await requireAdmin();
}

export function createSuccessResponse(
  imageData: string,
  mimeType = 'image/jpeg',
  enhanced = false
): ImageActionResult {
  return {
    success: true,
    imageData,
    mimeType,
    enhancedWithAI: enhanced
  };
}

export function createErrorResponse(error: unknown): ImageActionResult {
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error'
  };
}

// Convert base64 to Buffer
export function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, 'base64');
}
```

### 2. Extract Upload Logic (~45 min)

**File**: `upload-to-s3.ts`
```typescript
'use server';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { buildS3Url } from '@/lib/utils/s3-url-utils';
import { validateAdminAccess } from './shared-utils';

/**
 * Upload base64 image to S3
 * @param podcastId - Podcast ID
 * @param base64Data - Base64 image data
 * @param mimeType - Image MIME type
 * @returns S3 URL or error
 */
export async function uploadBase64ImageToS3(
  podcastId: string,
  base64Data: string,
  mimeType = 'image/jpeg'
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    await validateAdminAccess();

    const imageBuffer = Buffer.from(base64Data, 'base64');
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });

    const bucket = process.env.S3_BUCKET_NAME!;
    const key = `podcasts/${podcastId}/cover-image-${Date.now()}.${mimeType.split('/')[1]}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: imageBuffer,
        ContentType: mimeType
      })
    );

    const imageUrl = await buildS3Url({ bucket, region: process.env.AWS_REGION!, key });
    return { success: true, imageUrl };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

### 3. Split Generation Sources (3 files, ~45 min each)

**File**: `generate-from-telegram.ts` (~150 lines)
- Import from Telegram scraper
- Call enhancement service
- Return base64

**File**: `generate-from-file.ts` (~150 lines)
- Accept FormData with file
- Convert to Buffer
- Call enhancement
- Return base64

**File**: `generate-from-url.ts` (~150 lines)
- Fetch from URL
- Validate is image
- Call enhancement
- Return base64

### 4. Gallery Management (~45 min)

**File**: `gallery-actions.ts` (~100 lines)
```typescript
'use server';

import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { validateAdminAccess } from './shared-utils';

export async function listPodcastImagesGallery(podcastId: string) {
  await validateAdminAccess();
  // List images from S3
  // Return gallery items
}

export async function deleteGalleryImage(s3Key: string) {
  await validateAdminAccess();
  // Delete from S3
}
```

### 5. Create Index (~10 min)

**File**: `index.ts`
```typescript
// Re-export all public functions
export * from './generate-from-telegram';
export * from './generate-from-file';
export * from './generate-from-url';
export * from './upload-to-s3';
export * from './gallery-actions';
export type * from './types';
```

---

## ✅ Checklist

### Pre-Work
- [ ] קרא את הקובץ המקורי בשלמותו
- [ ] הבן את ה-flow של image generation
- [ ] בדוק את Gemini API docs

### During
- [ ] צור shared-utils.ts קודם
- [ ] העבר upload logic
- [ ] פצל לפי source type
- [ ] צור gallery actions
- [ ] צור index.ts
- [ ] הוסף JSDoc

### Post-Work
- [ ] Test עם Telegram source
- [ ] Test עם file upload
- [ ] Test עם URL
- [ ] Test gallery
- [ ] `npm run typecheck`
- [ ] `npm run build`

---

## 🎯 Success Criteria

- [ ] כל קובץ < 150 שורות
- [ ] אין code duplication
- [ ] Type-safe
- [ ] Error handling consistent
- [ ] Works with existing UI

---

**Status**: ⬜ לא התחיל | **Priority**: 🔴 גבוהה
**Docs**: [Next.js Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations), [Gemini API](https://ai.google.dev/gemini-api/docs/image-generation)
