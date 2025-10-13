# משימה 4.1: Split Post-Processing Service

## מטרה
פיצול `services/post-processing.ts` (407 שורות) ל-services ממוקדים + orchestrator

## עדיפות: 🔴 גבוהה | זמן: 4-5 שעות | תחום: Services (04)

---

## 📊 מצב נוכחי

**File**: `src/lib/services/post-processing.ts` - 407 שורות
**Problem**: Service אחד עושה הכל:
- Transcript processing
- Title generation
- Summary generation
- Image generation
- Episode updating

**Anti-Pattern**: God Object / Service with multiple responsibilities

---

## 🎯 מבנה מוצע (Clean Architecture)

```
services/episode-processing/
├── transcript-service.ts        (~80 שורות)
├── title-generation-service.ts  (~60 שורות)
├── summary-service.ts           (~60 שורות)
├── image-service.ts             (~80 שורות)
├── episode-orchestrator.ts      (~100 שורות)
├── types.ts                     (~30 שורות)
└── index.ts                     (~20 שורות)
```

---

## 📚 Clean Architecture Principles

**Resources:**
- https://alexkondov.com/full-stack-tao-clean-architecture-react/
- https://paulallies.medium.com/clean-architecture-typescript-and-react-8e509098abfe

**SOLID Principles:**
1. **Single Responsibility** - Service אחד לדבר אחד
2. **Open/Closed** - פתוח להרחבה, סגור לשינוי
3. **Dependency Inversion** - תלוי ב-interfaces, לא ב-implementations

**Patterns:**
- Strategy Pattern (different AI providers)
- Factory Pattern (service creation)
- Dependency Injection

---

## 📝 Implementation

### 1. Define Interfaces (~30 min)

**File**: `types.ts`
```typescript
export interface ITranscriptService {
  process(transcript: string): string;
  validate(transcript: string): boolean;
}

export interface ITitleGenerationService {
  generate(content: string, language: string): Promise<string>;
}

export interface ISummaryService {
  generate(content: string, language: string): Promise<string>;
}

export interface IImageService {
  generate(episodeId: string, summary: string): Promise<string | null>;
}

export interface IEpisodeOrchestrator {
  processEpisode(episodeId: string, options?: ProcessOptions): Promise<ProcessResult>;
}

export type ProcessOptions = {
  skipTitle?: boolean;
  skipSummary?: boolean;
  skipImage?: boolean;
};

export type ProcessResult = {
  success: boolean;
  episode?: Episode;
  error?: string;
};
```

### 2. Transcript Service (~45 min)

**File**: `transcript-service.ts`
```typescript
import type { ITranscriptService } from './types';

export class TranscriptService implements ITranscriptService {
  /**
   * Clean and prepare transcript for AI processing
   */
  process(transcript: string): string {
    return transcript
      .trim()
      .replace(/\s+/g, ' ')  // normalize whitespace
      .replace(/[^\w\s\u0590-\u05FF.,!?]/g, ''); // keep letters + Hebrew
  }

  /**
   * Validate transcript is not empty and has minimum length
   */
  validate(transcript: string): boolean {
    const processed = this.process(transcript);
    return processed.length >= 100; // minimum 100 chars
  }
}
```

### 3. Title Generation Service (~45 min)

**File**: `title-generation-service.ts`
```typescript
import { AIService } from '@/lib/ai';
import type { ITitleGenerationService } from './types';

export class TitleGenerationService implements ITitleGenerationService {
  constructor(private aiService: AIService) {}

  async generate(content: string, language: string): Promise<string> {
    const { title } = await this.aiService.generateTitleAndSummary(
      content,
      { language, style: 'engaging', maxLength: 60 },
      { language, style: 'concise', maxLength: 1 } // dummy summary
    );
    return title;
  }
}
```

### 4. Episode Orchestrator (~1 hour)

**File**: `episode-orchestrator.ts`
```typescript
import type {
  IEpisodeOrchestrator,
  ITranscriptService,
  ITitleGenerationService,
  ISummaryService,
  IImageService,
  ProcessOptions,
  ProcessResult
} from './types';

/**
 * Coordinates the episode processing pipeline
 * Uses Dependency Injection for testability
 */
export class EpisodeOrchestrator implements IEpisodeOrchestrator {
  constructor(
    private transcriptService: ITranscriptService,
    private titleService: ITitleGenerationService,
    private summaryService: ISummaryService,
    private imageService: IImageService,
    private db: Database // or pass as method param
  ) {}

  async processEpisode(
    episodeId: string,
    options: ProcessOptions = {}
  ): Promise<ProcessResult> {
    try {
      // 1. Get episode & transcript
      const episode = await this.db.episodes.findById(episodeId);
      if (!episode) throw new Error('Episode not found');

      const transcript = await this.getTranscript(episode);
      if (!this.transcriptService.validate(transcript)) {
        throw new Error('Invalid transcript');
      }

      // 2. Process transcript
      const processed = this.transcriptService.process(transcript);

      // 3. Generate title & summary in parallel
      const [title, summary] = await Promise.all([
        options.skipTitle ? '' : this.titleService.generate(processed, episode.language),
        options.skipSummary ? '' : this.summaryService.generate(processed, episode.language)
      ]);

      // 4. Update episode
      await this.db.episodes.update(episodeId, { title, description: summary });

      // 5. Generate image (optional)
      if (!options.skipImage && summary) {
        await this.imageService.generate(episodeId, summary);
      }

      return {
        success: true,
        episode: { ...episode, title, description: summary }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async getTranscript(episode: Episode): Promise<string> {
    // Fetch from S3 or database
    return ''; // implementation
  }
}
```

### 5. Factory Pattern (~30 min)

**File**: `index.ts`
```typescript
import { TranscriptService } from './transcript-service';
import { TitleGenerationService } from './title-generation-service';
import { SummaryService } from './summary-service';
import { ImageService } from './image-service';
import { EpisodeOrchestrator } from './episode-orchestrator';
import { AIService } from '@/lib/ai';

/**
 * Factory function to create fully wired orchestrator
 */
export function createEpisodeProcessor(config: {
  aiApiKey: string;
  database: Database;
}) {
  // Create services
  const aiService = new AIService({ apiKey: config.aiApiKey });
  const transcriptService = new TranscriptService();
  const titleService = new TitleGenerationService(aiService);
  const summaryService = new SummaryService(aiService);
  const imageService = new ImageService(aiService, config.database);

  // Create and return orchestrator
  return new EpisodeOrchestrator(
    transcriptService,
    titleService,
    summaryService,
    imageService,
    config.database
  );
}

// Re-exports
export * from './types';
export { EpisodeOrchestrator } from './episode-orchestrator';
```

---

## ✅ Checklist

- [ ] קרא Clean Architecture patterns
- [ ] הגדר interfaces קודם
- [ ] צור services קטנים
- [ ] צור orchestrator
- [ ] הוסף factory function
- [ ] כתוב unit tests עם mocks
- [ ] עדכן callers
- [ ] מחק קובץ ישן

---

## 🎯 Benefits

✅ **Testability** - Easy to mock dependencies
✅ **Flexibility** - Easy to swap implementations
✅ **Maintainability** - Clear responsibilities
✅ **Reusability** - Services can be used separately

**Status**: ⬜ לא התחיל
