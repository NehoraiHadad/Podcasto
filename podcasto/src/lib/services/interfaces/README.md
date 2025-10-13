# Service Interfaces

This directory contains TypeScript interfaces for all services in the Podcasto application. These interfaces enable type-safe dependency injection, improve testability, and provide clear contracts for service implementations.

## Quick Start

### Import Interfaces

```typescript
import {
  IS3Service,
  IEmailSender,
  IPostProcessingOrchestrator,
  ITelegramDataService,
  IEpisodeUpdater,
  IPodcastImageEnhancer,
  IPromptGenerator
} from '@/lib/services/interfaces';
```

### Use in Function Parameters

```typescript
async function processEpisode(
  episodeId: string,
  s3Service: IS3Service,
  emailSender: IEmailSender
) {
  const { files, error } = await s3Service.listEpisodeFiles(podcastId, episodeId);
  // Type-safe service usage
}
```

### Use in Class Constructors

```typescript
class EpisodeProcessor {
  constructor(
    private s3Service: IS3Service,
    private transcriptService: ITranscriptService,
    private titleService: ITitleGenerationService
  ) {}

  async process(episodeId: string) {
    const transcript = await this.transcriptService.getTranscriptWithRetry(
      podcastId,
      episodeId
    );
    // ...
  }
}
```

## Available Interfaces

### Storage (`storage.interface.ts`)

**IS3Service** - S3 file storage operations
- Upload, download, list, delete files
- Episode and podcast folder management
- Transcript retrieval

### Email (`email.interface.ts`)

**IEmailSender** - Bulk email notifications
- Send emails to subscribers with rate limiting
- Batch recording to database

### Post-Processing (`post-processing*.interface.ts`)

**ITranscriptService** - Transcript processing
- Retry logic for S3 retrieval
- Preprocessing and cleaning

**ITitleGenerationService** - AI title generation
- Generate episode titles from transcripts

**ISummaryGenerationService** - AI summary generation
- Generate episode summaries from transcripts

**IImageGenerationService** - AI image generation
- Generate cover images from descriptions
- Preview generation without uploading

**IPostProcessingOrchestrator** - Complete workflow
- Coordinates all post-processing steps
- Title, summary, and image generation

### Image (`image.interface.ts`)

**IPodcastImageEnhancer** - AI image enhancement
- Transform images into podcast covers
- Support for multiple variations

**IPodcastImageAnalyzer** - AI image analysis
- Analyze image content
- Generate enhancement prompts

**IImageHandler** - Image operations
- Generate, preview, and save images
- Episode image management

### Telegram (`telegram.interface.ts`)

**ITelegramDataService** - Telegram content retrieval
- Fetch Telegram data from S3 with retry
- Validate data structure

### Episode (`episode.interface.ts`)

**IEpisodeUpdater** - Episode status management
- Update episode metadata
- Track processing status
- Handle errors gracefully

### Prompt (`prompt.interface.ts`)

**IPromptGenerator** - AI prompt generation
- Generate enhanced image prompts

**IPromptCleaner** - Prompt sanitization
- Extract and clean AI responses

## Design Principles

### Interface Segregation

Each interface focuses on a single responsibility:
- ✅ Small, focused interfaces
- ✅ Easy to implement
- ✅ Easy to mock in tests

### Dependency Inversion

Services depend on abstractions:
- ✅ Decoupled from concrete implementations
- ✅ Testable with mocks
- ✅ Flexible architecture

### Type Safety

All methods are fully typed:
- ✅ No `any` types
- ✅ Proper return types
- ✅ Optional parameters documented

## Error Handling Patterns

### Pattern 1: Result Objects (Preferred)

```typescript
interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Usage
const result = await s3Service.listEpisodeFiles(podcastId, episodeId);
if (result.error) {
  console.error(result.error);
  return;
}
const files = result.files;
```

### Pattern 2: Throw on Error

```typescript
try {
  const transcript = await transcriptService.getTranscriptWithRetry(
    podcastId,
    episodeId
  );
} catch (error) {
  console.error('Failed to get transcript:', error);
}
```

### Pattern 3: Non-Blocking (Logs Only)

```typescript
// Doesn't throw, logs internally
await episodeUpdater.markEpisodeAsFailed(episodeId, error);
await emailSender.recordBulkSentEmails(records, logPrefix);
```

## Testing with Interfaces

### Mock Implementation

```typescript
import { IS3Service } from '@/lib/services/interfaces';

const mockS3Service: IS3Service = {
  listEpisodeFiles: jest.fn().mockResolvedValue({ files: [] }),
  getFileContent: jest.fn().mockResolvedValue({ content: null }),
  getFileMetadata: jest.fn().mockResolvedValue({ metadata: null }),
  uploadImageToS3: jest.fn().mockResolvedValue({ url: 'http://example.com/image.jpg' }),
  deleteFile: jest.fn().mockResolvedValue({ success: true }),
  deleteAllEpisodeFiles: jest.fn().mockResolvedValue({ success: true, deletedCount: 0 }),
  deleteEpisodeFromS3: jest.fn().mockResolvedValue({ success: true, deletedCount: 0 }),
  deletePodcastFromS3: jest.fn().mockResolvedValue({ success: true, deletedCount: 0 }),
  getTranscriptFromS3: jest.fn().mockResolvedValue('transcript text'),
};

// Use in tests
test('process episode', async () => {
  await processEpisode('episode-1', mockS3Service, mockEmailSender);
  expect(mockS3Service.listEpisodeFiles).toHaveBeenCalledWith('podcast-1', 'episode-1');
});
```

### Partial Mocks

```typescript
const partialMock: Partial<IS3Service> = {
  getTranscriptFromS3: jest.fn().mockResolvedValue('transcript'),
};

// TypeScript ensures you only implement needed methods
```

## File Organization

```
interfaces/
├── index.ts                                 # Central export
├── storage.interface.ts                     # S3 operations
├── email.interface.ts                       # Email notifications
├── post-processing.interface.ts             # Re-export wrapper
├── post-processing-types.interface.ts       # Shared types
├── post-processing-services.interface.ts    # Individual services
├── post-processing-orchestrator.interface.ts # Orchestrator
├── image.interface.ts                       # Image operations
├── telegram.interface.ts                    # Telegram data
├── episode.interface.ts                     # Episode updates
└── prompt.interface.ts                      # Prompt generation
```

## Future: Dependency Injection

These interfaces are designed to support DI containers:

```typescript
// Future implementation example
import { container } from '@/lib/di';

container.register<IS3Service>('S3Service', S3Service);
container.register<IEmailSender>('EmailSender', EmailSender);

// Resolve with dependencies
const processor = container.resolve<IPostProcessingOrchestrator>('PostProcessingOrchestrator');
```

## Best Practices

### DO ✅

- Import interfaces from central `index.ts`
- Use interfaces in function parameters
- Use interfaces in class constructors
- Create mocks that implement full interfaces
- Document all interface methods

### DON'T ❌

- Import concrete service classes in business logic
- Create interfaces after implementation (design first)
- Skip JSDoc documentation
- Use `any` types in interfaces
- Create circular dependencies between interfaces

## Contributing

When adding new interfaces:

1. Create interface file in this directory
2. Add comprehensive JSDoc comments
3. Keep files under 150 lines
4. Export from `index.ts`
5. Update this README
6. Ensure build passes: `npm run build`

## Questions?

See `/ProjectDocs/refactoring/task-4.5-interfaces-summary.md` for detailed implementation notes.
