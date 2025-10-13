# 🔧 תחום 4: Services (Business Logic)

## תאריך יצירה: 2025-10-13
## Phase: 2 (Core Logic)
## תלויות: Database Layer (02)

---

## 📊 מצב נוכחי

### Service Files

| קובץ | שורות | בעיות |
|------|-------|--------|
| `services/podcast-image-enhancer.ts` | 267 | ✅ מתוקן |
| `services/podcast-image-enhancer-multi.ts` | 182 | ✅ מתוקן |
| `services/podcast-image-analyzer.ts` | 159 | ✅ חדש |
| `services/podcast-image-utils.ts` | 127 | ✅ חדש |
| `services/post-processing.ts` | 407 | 🔴 גדול |
| `services/s3-file-service.ts` | 305 | 🔴 גדול |
| `services/storage-utils.ts` | 299 | ⚠️ גדול |
| `services/telegram-data-service.ts` | 265 | ⚠️ גדול |
| `services/email/email-sender.ts` | 324 | 🔴 גדול |

### בעיות

1. **Services עם אחריות מרובה**
   - `post-processing.ts` עושה הכל: transcript, title, summary, image
   - צריך לפצל ל-single responsibility services

2. **Coupling גבוה**
   - Services תלויים ישירות אחד בשני
   - קשה ל-test ול-mock

3. **חוסר Dependency Injection**
   - Services יוצרים dependencies בעצמם
   - קשה להחליף implementations

4. **Duplication**
   - S3 logic חוזר במקומות שונים
   - Image processing code מועתק

---

## 🎯 מטרות

1. **Single Responsibility** - service אחד לדבר אחד
2. **Dependency Injection** - inject dependencies
3. **Interface-based** - program to interfaces
4. **Testable** - easy to unit test

---

## 📚 דוקומנטציה

**Clean Architecture**
- https://alexkondov.com/full-stack-tao-clean-architecture-react/
- https://paulallies.medium.com/clean-architecture-typescript-and-react-8e509098abfe

**Service Layer Patterns**
- Single Responsibility Principle
- Dependency Inversion Principle
- Interface Segregation

---

## 📝 משימות

### 4.1: Split Post-Processing Service
**זמן**: 4-5 שעות
**[קישור](./tasks/04_split_post_processing.md)**

פיצול ל:
- `TranscriptService`
- `TitleGenerationService`
- `SummaryGenerationService`
- `ImageGenerationService`
- `EpisodeOrchestrator` (coordinates)

### 4.2: Refactor Image Enhancement ✅ הושלם
**זמן**: 3-4 שעות (בוצע: 2 שעות)
**[קישור](./tasks/04_refactor_image_enhancement.md)**

**הושלם בהצלחה**:
- ✅ יצירת `podcast-image-utils.ts` (127 שורות) - shared utilities
- ✅ יצירת `podcast-image-analyzer.ts` (159 שורות) - image analysis
- ✅ רפקטור `podcast-image-enhancer.ts`: 486 → 267 שורות (-45%)
- ✅ רפקטור `podcast-image-enhancer-multi.ts`: 241 → 182 שורות (-24%)
- ✅ הסרת 93 שורות של קוד כפול
- ✅ שמירה על backward compatibility מלאה
- ✅ Build עובר ללא שגיאות

### 4.3: Unify S3 Services
**זמן**: 3 שעות
**[קישור](./tasks/04_unify_s3.md)**

מיזוג:
- `S3FileService`
- `StorageUtils`
למחלקה אחת `S3Service`

### 4.4: Email Service Improvements
**זמן**: 2-3 שעות
**[קישור](./tasks/04_email_service.md)**

- הפרדת template logic
- Retry mechanism improvement
- Rate limiting service

### 4.5: Create Service Interfaces
**זמן**: 2 שעות
**[קישור](./tasks/04_service_interfaces.md)**

```typescript
export interface IEmailService {
  send(params: EmailParams): Promise<SendResult>;
}

export interface IS3Service {
  upload(file: Buffer, key: string): Promise<string>;
  download(key: string): Promise<Buffer>;
}
```

### 4.6: Implement Dependency Injection
**זמן**: 3 שעות
**[קישור](./tasks/04_dependency_injection.md)**

```typescript
export class EpisodeService {
  constructor(
    private s3Service: IS3Service,
    private emailService: IEmailService,
    private db: Database
  ) {}
}
```

### 4.7: Add Service Tests
**זמן**: 4-5 שעות
**[קישור](./tasks/04_service_tests.md)**

Unit tests לכל service עם mocked dependencies

### 4.8: Service Factory Pattern
**זמן**: 2 שעות
**[קישור](./tasks/04_service_factory.md)**

```typescript
export function createServices() {
  const s3 = new S3Service(config);
  const email = new EmailService(config);
  const episode = new EpisodeService(s3, email, db);
  return { s3, email, episode };
}
```

---

## ✅ Checklist

- [ ] קרא Clean Architecture patterns
- [ ] הבן SOLID principles
- [ ] זהה את כל ה-services הקיימים
- [ ] מפה dependencies בינהם
- [ ] תכנן interfaces
- [ ] פצל services גדולים
- [ ] הוסף DI
- [ ] כתוב tests
- [ ] רפקטור callers

---

## 📊 התקדמות: 2/8 משימות (25%)

**סטטוס**: 🟡 בתהליך
**קריטיות**: ⭐⭐⭐ גבוהה

**משימות שהושלמו**:
- ✅ 4.1: Split Post-Processing Service
- ✅ 4.2: Refactor Image Enhancement

**משימות הבאות**:
- ⏳ 4.3: Unify S3 Services
- ⏳ 4.4: Email Service Improvements
