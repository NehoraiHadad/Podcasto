# Dependency Injection Guide - Podcasto Services

## Quick Reference

This guide shows how to use the new Dependency Injection pattern for Podcasto services.

---

## Table of Contents
- [Why Dependency Injection?](#why-dependency-injection)
- [Quick Start](#quick-start)
- [Service Factory](#service-factory)
- [Individual Services](#individual-services)
- [Testing with DI](#testing-with-di)
- [Migration Examples](#migration-examples)

---

## Why Dependency Injection?

**Before DI:**
```typescript
class EpisodeProcessor {
  private s3 = new S3Service();  // Hard-coded dependency
  private email = new EmailService();

  // Hard to test, tightly coupled
}
```

**After DI:**
```typescript
class EpisodeProcessor {
  constructor(
    private s3: IS3Service,        // Injected interface
    private email: IEmailService
  ) {}

  // Easy to test, loosely coupled
}
```

**Benefits:**
- ✅ Easy to test (mock interfaces)
- ✅ Flexible (swap implementations)
- ✅ Type-safe (interface contracts)
- ✅ Maintainable (clear dependencies)

---

## Quick Start

### Option 1: Use Service Factory (Recommended)

```typescript
import { createAllServices } from '@/lib/services/service-factory';

// Create all services with proper DI
const services = createAllServices({
  s3: {
    bucket: process.env.S3_BUCKET_NAME,
    region: process.env.AWS_REGION
  },
  ai: {
    apiKey: process.env.GEMINI_API_KEY
  }
});

// Use any service
await services.s3Service.uploadFile(...);
await services.titleService?.generateTitle(...);
```

### Option 2: Create Individual Services

```typescript
import { createS3Service, createEpisodeUpdater } from '@/lib/services';

const s3Service = createS3Service();
const episodeUpdater = createEpisodeUpdater();
```

### Option 3: Manual Construction (For Testing)

```typescript
import { S3Service, EpisodeUpdater } from '@/lib/services';
import type { IS3Service, IEpisodeUpdater } from '@/lib/services/interfaces';

const s3: IS3Service = new S3Service({ bucket: 'test-bucket' });
const updater: IEpisodeUpdater = new EpisodeUpdater();
```

---

## Service Factory

The `service-factory.ts` provides convenient ways to create services:

### Create All Services

```typescript
import { createAllServices, type ServiceCollection } from '@/lib/services/service-factory';

const services: ServiceCollection = createAllServices({
  s3: {
    bucket: 'my-bucket',
    region: 'us-east-1',
    accessKeyId: 'key',
    secretAccessKey: 'secret'
  },
  ai: {
    apiKey: 'gemini-key'
  }
});

// Available services:
services.s3Service          // IS3Service
services.episodeUpdater     // IEpisodeUpdater
services.transcriptService  // ITranscriptService
services.telegramDataService // ITelegramDataService
services.aiService          // AIService (optional)
services.titleService       // ITitleGenerationService (optional)
services.summaryService     // ISummaryGenerationService (optional)
services.imageService       // IImageGenerationService (optional)
services.imageAnalyzer      // IPodcastImageAnalyzer (optional)
services.imageEnhancer      // IPodcastImageEnhancer (optional)
```

### Create S3 Services Only

```typescript
import { createS3Services } from '@/lib/services/service-factory';

const { s3Service, transcriptService, telegramDataService } = createS3Services({
  bucket: 'my-bucket',
  region: 'us-east-1'
});
```

### Create AI Services Only

```typescript
import { createAIServices } from '@/lib/services/service-factory';

const {
  aiService,
  titleService,
  summaryService,
  imageService,
  imageAnalyzer,
  imageEnhancer
} = createAIServices({
  apiKey: process.env.GEMINI_API_KEY!
});
```

---

## Individual Services

### S3Service

```typescript
import { createS3Service } from '@/lib/services/s3-service';
import type { IS3Service } from '@/lib/services/interfaces';

// With config
const s3: IS3Service = createS3Service({
  bucket: 'my-bucket',
  region: 'us-east-1',
  accessKeyId: 'key',
  secretAccessKey: 'secret'
});

// With env vars (default)
const s3 = createS3Service();

// Usage
const { files } = await s3.listEpisodeFiles('podcast-1', 'episode-1');
const { content } = await s3.getFileContent('path/to/file.txt');
```

### EpisodeUpdater

```typescript
import { createEpisodeUpdater } from '@/lib/services/episode-updater';
import type { IEpisodeUpdater } from '@/lib/services/interfaces';

const updater: IEpisodeUpdater = createEpisodeUpdater();

await updater.updateEpisodeWithSummary('ep-1', 'Title', 'Summary');
await updater.markEpisodeAsPublished('ep-1');
```

### TranscriptProcessor

```typescript
import { createS3Service } from '@/lib/services/s3-service';
import { createTranscriptProcessor } from '@/lib/services/transcript-processor';
import type { IS3Service, ITranscriptService } from '@/lib/services/interfaces';

// Create S3 dependency first
const s3: IS3Service = createS3Service();

// Inject into transcript processor
const transcriptService: ITranscriptService = createTranscriptProcessor(s3);

// Usage
const transcript = await transcriptService.getTranscriptWithRetry(
  'podcast-1',
  'episode-1',
  3 // max retries
);

const processed = transcriptService.preprocessTranscript(transcript);
```

### AI Services

```typescript
import { AIService } from '@/lib/ai';
import {
  createTitleGenerationService,
  createSummaryGenerationService,
  createImageGenerationService
} from '@/lib/services';

const aiService = new AIService({ apiKey: process.env.GEMINI_API_KEY! });

const titleService = createTitleGenerationService(aiService);
const summaryService = createSummaryGenerationService(aiService);
const imageService = createImageGenerationService(aiService);

// Usage
const title = await titleService.generateTitle(transcript, {
  language: 'English',
  style: 'engaging',
  maxLength: 60
});

const summary = await summaryService.generateSummary(transcript, {
  language: 'English',
  style: 'concise',
  maxLength: 150
});

const imageResult = await imageService.generateImagePreview(summary, title);
```

### Image Enhancement Services

```typescript
import {
  createPodcastImageAnalyzer,
  createPodcastImageEnhancer
} from '@/lib/services';

const apiKey = process.env.GEMINI_API_KEY!;

// Create analyzer first
const analyzer = createPodcastImageAnalyzer(apiKey);

// Inject analyzer into enhancer
const enhancer = createPodcastImageEnhancer(apiKey, analyzer);

// Usage
const result = await enhancer.enhanceImage(imageBuffer, {
  podcastTitle: 'My Podcast',
  podcastStyle: 'modern, professional',
  aspectRatio: '1:1',
  variationsCount: 3
});

if (result.success && result.variations) {
  console.log(`Generated ${result.variations.length} variations`);
}
```

### TelegramDataService

```typescript
import { createTelegramDataService } from '@/lib/services/telegram-data-service';
import type { ITelegramDataService } from '@/lib/services/interfaces';

// With default bucket from env
const telegramService: ITelegramDataService = createTelegramDataService();

// With custom bucket
const telegramService = createTelegramDataService('my-custom-bucket');

// Usage
const data = await telegramService.getTelegramData(
  'podcast-1',
  'episode-1',
  undefined,
  true // enable retry
);

if (data && telegramService.validateTelegramData(data)) {
  console.log('Valid telegram data received');
}
```

---

## Testing with DI

### Mocking Services

```typescript
import type { IS3Service, IEpisodeUpdater } from '@/lib/services/interfaces';

describe('EpisodeProcessor', () => {
  it('should process episode', async () => {
    // Create mock services
    const mockS3: IS3Service = {
      uploadFile: jest.fn().mockResolvedValue({ url: 'http://example.com/file' }),
      getFileContent: jest.fn().mockResolvedValue({ content: 'test content' }),
      listEpisodeFiles: jest.fn().mockResolvedValue({ files: [] }),
      // ... other methods
    } as IS3Service;

    const mockUpdater: IEpisodeUpdater = {
      updateEpisodeWithSummary: jest.fn(),
      markEpisodeAsPublished: jest.fn(),
      // ... other methods
    } as IEpisodeUpdater;

    // Inject mocks
    const processor = new EpisodeProcessor(mockS3, mockUpdater);

    // Test
    await processor.process('episode-1');

    // Verify
    expect(mockS3.uploadFile).toHaveBeenCalled();
    expect(mockUpdater.markEpisodeAsPublished).toHaveBeenCalled();
  });
});
```

### Using Test Doubles

```typescript
import type { IS3Service } from '@/lib/services/interfaces';

class MockS3Service implements IS3Service {
  private files = new Map<string, string>();

  async uploadFile(key: string, content: Buffer) {
    this.files.set(key, content.toString());
    return { url: `http://test.com/${key}` };
  }

  async getFileContent(key: string) {
    const content = this.files.get(key);
    return { content: content || null };
  }

  // ... implement other methods
}

// Use in tests
const s3 = new MockS3Service();
const service = new SomeService(s3);
```

---

## Migration Examples

### Example 1: Server Action

**Before:**
```typescript
'use server';

import { s3Service } from '@/lib/services/s3-service';
import { episodeUpdater } from '@/lib/services/episode-updater';

export async function processEpisode(episodeId: string) {
  const { content } = await s3Service.getFileContent(`episodes/${episodeId}/data.json`);
  await episodeUpdater.markEpisodeAsPublished(episodeId);
}
```

**After (Recommended):**
```typescript
'use server';

import { createS3Service } from '@/lib/services/s3-service';
import { createEpisodeUpdater } from '@/lib/services/episode-updater';

export async function processEpisode(episodeId: string) {
  // Create services fresh for each request
  const s3Service = createS3Service();
  const episodeUpdater = createEpisodeUpdater();

  const { content } = await s3Service.getFileContent(`episodes/${episodeId}/data.json`);
  await episodeUpdater.markEpisodeAsPublished(episodeId);
}
```

**After (Using Factory):**
```typescript
'use server';

import { createAllServices } from '@/lib/services/service-factory';

export async function processEpisode(episodeId: string) {
  const services = createAllServices();

  const { content } = await services.s3Service.getFileContent(
    `episodes/${episodeId}/data.json`
  );
  await services.episodeUpdater.markEpisodeAsPublished(episodeId);
}
```

### Example 2: API Route

**Before:**
```typescript
import { NextRequest } from 'next/server';
import { s3Service } from '@/lib/services/s3-service';

export async function GET(req: NextRequest) {
  const files = await s3Service.listEpisodeFiles('podcast-1', 'episode-1');
  return Response.json(files);
}
```

**After:**
```typescript
import { NextRequest } from 'next/server';
import { createS3Service } from '@/lib/services/s3-service';

export async function GET(req: NextRequest) {
  const s3Service = createS3Service();
  const files = await s3Service.listEpisodeFiles('podcast-1', 'episode-1');
  return Response.json(files);
}
```

### Example 3: Custom Service Class

**Before:**
```typescript
import { S3Service } from '@/lib/services/s3-service';
import { EpisodeUpdater } from '@/lib/services/episode-updater';

export class MyCustomService {
  private s3 = new S3Service();
  private updater = new EpisodeUpdater();

  async doSomething() {
    await this.s3.uploadFile(...);
    await this.updater.markEpisodeAsPublished(...);
  }
}
```

**After:**
```typescript
import type { IS3Service, IEpisodeUpdater } from '@/lib/services/interfaces';

export class MyCustomService {
  constructor(
    private s3Service: IS3Service,
    private episodeUpdater: IEpisodeUpdater
  ) {
    if (!s3Service) throw new Error('s3Service is required');
    if (!episodeUpdater) throw new Error('episodeUpdater is required');
  }

  async doSomething() {
    await this.s3Service.uploadFile(...);
    await this.episodeUpdater.markEpisodeAsPublished(...);
  }
}

// Usage
import { createS3Service, createEpisodeUpdater } from '@/lib/services';

const myService = new MyCustomService(
  createS3Service(),
  createEpisodeUpdater()
);
```

---

## Common Patterns

### Pattern 1: Service with No Dependencies

```typescript
import type { IEpisodeUpdater } from '@/lib/services/interfaces';

export class EpisodeUpdater implements IEpisodeUpdater {
  // No dependencies needed
  constructor() {}

  async updateEpisodeWithSummary(id: string, title: string, summary: string) {
    // Implementation
  }
}

export function createEpisodeUpdater(): IEpisodeUpdater {
  return new EpisodeUpdater();
}
```

### Pattern 2: Service with Single Dependency

```typescript
import type { IS3Service, ITranscriptService } from '@/lib/services/interfaces';

export class TranscriptProcessor implements ITranscriptService {
  constructor(private s3Service: IS3Service) {
    if (!s3Service) throw new Error('s3Service is required');
  }

  async getTranscriptWithRetry(podcastId: string, episodeId: string) {
    return this.s3Service.getTranscriptFromS3(podcastId, episodeId);
  }
}

export function createTranscriptProcessor(s3Service: IS3Service): ITranscriptService {
  if (!s3Service) throw new Error('s3Service is required');
  return new TranscriptProcessor(s3Service);
}
```

### Pattern 3: Service with Multiple Dependencies

```typescript
import type {
  IS3Service,
  IEpisodeUpdater,
  IImageGenerationService,
  IImageHandler
} from '@/lib/services/interfaces';

export class ImageHandler implements IImageHandler {
  constructor(
    private s3Service: IS3Service,
    private episodeUpdater: IEpisodeUpdater,
    private imageService: IImageGenerationService
  ) {
    if (!s3Service) throw new Error('s3Service is required');
    if (!episodeUpdater) throw new Error('episodeUpdater is required');
    if (!imageService) throw new Error('imageService is required');
  }

  async generateEpisodeImage(episodeId: string, podcastId: string, summary: string) {
    const result = await this.imageService.generateImagePreview(summary);
    if (result.imageData) {
      await this.s3Service.uploadImageToS3(podcastId, episodeId, result.imageData, result.mimeType);
      await this.episodeUpdater.markEpisodeAsPublished(episodeId);
    }
  }
}

export function createImageHandler(
  s3Service: IS3Service,
  episodeUpdater: IEpisodeUpdater,
  imageService: IImageGenerationService
): IImageHandler {
  return new ImageHandler(s3Service, episodeUpdater, imageService);
}
```

---

## Best Practices

### ✅ DO

1. **Depend on interfaces, not concrete classes**
   ```typescript
   constructor(private s3: IS3Service) {}  // Good
   ```

2. **Validate dependencies in constructor**
   ```typescript
   constructor(private s3: IS3Service) {
     if (!s3) throw new Error('s3Service is required');
   }
   ```

3. **Use factory functions for creation**
   ```typescript
   const service = createMyService(dependency);
   ```

4. **Return interface types from factories**
   ```typescript
   export function createMyService(): IMyService {
     return new MyService();
   }
   ```

5. **Create services per request in server actions**
   ```typescript
   export async function myAction() {
     const services = createAllServices();
     // Use services
   }
   ```

### ❌ DON'T

1. **Don't instantiate dependencies inside classes**
   ```typescript
   private s3 = new S3Service();  // Bad
   ```

2. **Don't depend on concrete classes**
   ```typescript
   constructor(private s3: S3Service) {}  // Bad
   ```

3. **Don't skip dependency validation**
   ```typescript
   constructor(private s3: IS3Service) {
     // Missing validation!
   }
   ```

4. **Don't use singletons in new code**
   ```typescript
   import { s3Service } from '@/lib/services';  // Deprecated
   ```

---

## Troubleshooting

### Error: "Expected 2 arguments, but got 1"

**Problem:** PodcastImageEnhancer constructor signature changed

**Solution:**
```typescript
// Before
const enhancer = new PodcastImageEnhancer(apiKey);

// After
const analyzer = createPodcastImageAnalyzer(apiKey);
const enhancer = createPodcastImageEnhancer(apiKey, analyzer);
```

### Error: "aiService does not exist in type"

**Problem:** ImageGenerationService constructor changed from config object to direct parameter

**Solution:**
```typescript
// Before
new ImageGenerationService({ aiService })

// After
new ImageGenerationService(aiService)
```

### Service not available in ServiceCollection

**Problem:** AI services are only created when AI config is provided

**Solution:**
```typescript
const services = createAllServices({
  ai: { apiKey: process.env.GEMINI_API_KEY! }  // Must provide AI config
});

// Check if available
if (services.titleService) {
  await services.titleService.generateTitle(...);
}
```

---

## Further Reading

- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Dependency Injection Pattern](https://en.wikipedia.org/wiki/Dependency_injection)
- [Task 4.6 Implementation Summary](./task-4.6-implementation-summary.md)
- [Service Interfaces Documentation](../../src/lib/services/interfaces/README.md)
