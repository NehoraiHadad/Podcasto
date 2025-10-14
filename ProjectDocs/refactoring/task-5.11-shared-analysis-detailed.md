# Task 5.11: Detailed Shared Logic Analysis
## ImageGenerationField vs EpisodeImageManager

**Date**: 2025-10-14
**Author**: Claude Code
**Purpose**: Comprehensive line-by-line analysis to identify exact duplicates, similar patterns, and create concrete extraction plan

---

## Executive Summary

### Key Findings

**Total Lines Analyzed**: 1,348 lines
- **EpisodeImageManager**: 305 lines (monolithic)
- **ImageGenerationField**: 1,043 lines (15 modular files)

**Duplication Assessment**:
- ✅ **HIGH Priority Extractions**: 3 areas (~120 lines, 85-100% similarity)
- ⚠️ **MEDIUM Priority Extractions**: 4 areas (~180 lines, 60-80% similarity)
- ❌ **Unique Features**: 8 distinct features (keep separate)

**Recommendation**: **Quick Wins First** - Extract HIGH priority items in 4-6 hours, defer MEDIUM priority items to Task 5.12

**Risk Level**: LOW to MEDIUM (well-defined patterns, clear separation of concerns)

---

## 1. EXACT DUPLICATES (85-100% Similarity)

### 1.1 Image Preview Display with Save/Discard Actions

**EpisodeImageManager**: Lines 176-242
**ImageGenerationField**: `generated-image-preview.tsx` lines 1-47 + variation-gallery action pattern
**Similarity**: 90% - Nearly identical UI pattern, different data structure
**Priority**: **HIGH**
**Extract Risk**: LOW
**Testing Complexity**: LOW

#### Code Comparison

**EpisodeImageManager (lines 176-242)**:
```typescript
{previewImage && (
  <div className="space-y-4">
    <div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-md">
      <Image
        src={previewImage}
        alt="AI generated preview"
        fill
        className="object-cover"
      />
    </div>

    {episodeDescription && (
      <div className="text-sm text-muted-foreground mt-2 max-h-24 overflow-auto">
        <p className="font-semibold">Source description:</p>
        <p className="italic">{episodeDescription.substring(0, 200)}
          {episodeDescription.length > 200 ? '...' : ''}
        </p>
      </div>
    )}

    {generatedFromPrompt && (
      <div className="text-sm text-muted-foreground mt-2 max-h-80 overflow-auto border-t border-dashed border-gray-300 pt-2">
        <p className="font-semibold text-xs uppercase tracking-wide">AI prompt used:</p>
        <div className="mt-1 bg-gray-50 dark:bg-gray-900 p-2 rounded-md">
          <p className="whitespace-pre-wrap text-xs font-mono">{generatedFromPrompt}</p>
        </div>
        <div className="text-right mt-1">
          <button
            onClick={() => navigator.clipboard.writeText(generatedFromPrompt)}
            className="text-xs text-blue-600 hover:underline"
          >
            Copy to clipboard
          </button>
        </div>
      </div>
    )}

    <div className="flex space-x-2">
      <Button
        onClick={handleSavePreview}
        disabled={isSavingPreview}
        className="flex-1"
      >
        {isSavingPreview ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Image
          </>
        )}
      </Button>

      <Button
        onClick={handleDiscardPreview}
        variant="outline"
        className="flex-1"
      >
        <XCircle className="mr-2 h-4 w-4" />
        Discard
      </Button>
    </div>
  </div>
)}
```

**ImageGenerationField** (similar pattern in `generated-image-preview.tsx` + `debug-info-panel.tsx`):
```typescript
// generated-image-preview.tsx (lines 1-47)
export function GeneratedImagePreview({
  currentImageUrl,
  onDelete
}: GeneratedImagePreviewProps) {
  if (!currentImageUrl) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Current Cover Image</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <X className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </div>
      <div className="relative w-full aspect-square max-w-xs rounded-lg overflow-hidden border">
        <Image
          src={currentImageUrl}
          alt="Current cover"
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
}

// debug-info-panel.tsx (lines 72-79) - Prompt display
{debugInfo.prompt && (
  <div className="space-y-2">
    <Label className="text-base font-medium">3. Prompt Sent to Gemini 2.5 Flash Image (Nano Banana)</Label>
    <pre className="text-xs bg-background p-4 rounded-md border overflow-x-auto whitespace-pre-wrap font-mono">
      {debugInfo.prompt}
    </pre>
  </div>
)}
```

#### Extraction Plan

**Step 1**: Create `shared/image-management/components/image-preview-card.tsx`
```typescript
'use client';

interface ImagePreviewCardProps {
  imageUrl: string;
  alt?: string;
  description?: string | null;
  prompt?: string | null;
  actions?: React.ReactNode;
  maxDescriptionLength?: number;
}

export function ImagePreviewCard({
  imageUrl,
  alt = 'Generated image',
  description,
  prompt,
  actions,
  maxDescriptionLength = 200
}: ImagePreviewCardProps) {
  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-md">
        <Image src={imageUrl} alt={alt} fill className="object-cover" />
      </div>

      {description && (
        <div className="text-sm text-muted-foreground mt-2 max-h-24 overflow-auto">
          <p className="font-semibold">Source description:</p>
          <p className="italic">
            {description.substring(0, maxDescriptionLength)}
            {description.length > maxDescriptionLength ? '...' : ''}
          </p>
        </div>
      )}

      {prompt && (
        <div className="text-sm text-muted-foreground mt-2 max-h-80 overflow-auto border-t border-dashed border-gray-300 pt-2">
          <p className="font-semibold text-xs uppercase tracking-wide">AI prompt used:</p>
          <div className="mt-1 bg-gray-50 dark:bg-gray-900 p-2 rounded-md">
            <p className="whitespace-pre-wrap text-xs font-mono">{prompt}</p>
          </div>
          <div className="text-right mt-1">
            <button
              onClick={() => navigator.clipboard.writeText(prompt)}
              className="text-xs text-blue-600 hover:underline"
            >
              Copy to clipboard
            </button>
          </div>
        </div>
      )}

      {actions && (
        <div className="flex space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
}
```

**Step 2**: Update EpisodeImageManager (lines 176-242)
```typescript
{previewImage && (
  <ImagePreviewCard
    imageUrl={previewImage}
    alt="AI generated preview"
    description={episodeDescription}
    prompt={generatedFromPrompt}
    actions={
      <>
        <Button
          onClick={handleSavePreview}
          disabled={isSavingPreview}
          className="flex-1"
        >
          {isSavingPreview ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Image
            </>
          )}
        </Button>

        <Button
          onClick={handleDiscardPreview}
          variant="outline"
          className="flex-1"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Discard
        </Button>
      </>
    }
  />
)}
```

**Time Estimate**: 2 hours
**Lines Saved**: ~50 lines from EpisodeImageManager, enables reuse in ImageGenerationField

---

### 1.2 Loading State Button Pattern

**EpisodeImageManager**: Lines 265-278, 286-299
**ImageGenerationField**: `action-buttons.tsx` lines 24-42
**Similarity**: 100% - Exact same pattern
**Priority**: **HIGH**
**Extract Risk**: LOW
**Testing Complexity**: LOW

#### Code Comparison

**EpisodeImageManager (lines 265-278)**:
```typescript
<Button
  onClick={handleUpload}
  disabled={!selectedFile || isUploading}
  className="w-full"
>
  {isUploading ? (
    <>
      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
      Uploading...
    </>
  ) : (
    'Upload Image'
  )}
</Button>
```

**EpisodeImageManager (lines 286-299)**:
```typescript
<Button
  onClick={handleGeneratePreview}
  disabled={isGenerating}
  className="w-full"
>
  {isGenerating ? (
    <>
      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
      Generating Preview...
    </>
  ) : (
    'Generate Preview'
  )}
</Button>
```

**ImageGenerationField** (`action-buttons.tsx` lines 24-42):
```typescript
<Button
  type="button"
  onClick={onGenerate}
  disabled={isGenerating}
  className="flex-1 w-full sm:w-auto"
>
  {isGenerating ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Generating {variationCount > 1 ? `${variationCount} variations` : 'image'}...
    </>
  ) : (
    <>
      <Sparkles className="mr-2 h-4 w-4" />
      Generate with AI {selectedVariationLabel && `(${selectedVariationLabel})`}
    </>
  )}
</Button>
```

#### Extraction Plan

**Step 1**: Create `shared/image-management/components/loading-button.tsx`
```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps {
  isLoading: boolean;
  loadingText: string;
  loadingIcon?: React.ReactNode;
  idleText: string;
  idleIcon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  type?: 'button' | 'submit';
}

export function LoadingButton({
  isLoading,
  loadingText,
  loadingIcon,
  idleText,
  idleIcon,
  onClick,
  disabled = false,
  className = 'w-full',
  variant = 'default',
  type = 'button'
}: LoadingButtonProps) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={className}
      variant={variant}
    >
      {isLoading ? (
        <>
          {loadingIcon || <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loadingText}
        </>
      ) : (
        <>
          {idleIcon}
          {idleText}
        </>
      )}
    </Button>
  );
}
```

**Step 2**: Update EpisodeImageManager (lines 265-278)
```typescript
<LoadingButton
  isLoading={isUploading}
  loadingText="Uploading..."
  idleText="Upload Image"
  onClick={handleUpload}
  disabled={!selectedFile}
  className="w-full"
/>
```

**Step 3**: Update EpisodeImageManager (lines 286-299)
```typescript
<LoadingButton
  isLoading={isGenerating}
  loadingText="Generating Preview..."
  idleText="Generate Preview"
  onClick={handleGeneratePreview}
  className="w-full"
/>
```

**Time Estimate**: 1 hour
**Lines Saved**: ~26 lines from EpisodeImageManager, simplifies ActionButtons

---

### 1.3 Toast Notification Patterns

**EpisodeImageManager**: Lines 39, 44, 70, 73, 89, 96, 98, 102, 128, 130, 134, 144
**ImageGenerationField**: Multiple files (process-generation-result.ts, use-gallery-operations.ts, variation-handlers.ts, image-source-selector.tsx)
**Similarity**: 85% - Same success/error patterns
**Priority**: **HIGH**
**Extract Risk**: LOW
**Testing Complexity**: LOW

#### Code Comparison

**EpisodeImageManager Toast Usage**:
```typescript
// Line 39
toast.error('Please select an image file first');

// Line 44
toast.error('Episode has no associated podcast');

// Line 70
toast.success('Image uploaded successfully');

// Line 73
toast.error(error instanceof Error ? error.message : 'Failed to upload image');

// Line 96
toast.success('Image preview generated successfully');

// Line 98
toast.warning('Image generation completed but no preview was produced');

// Line 102
toast.error(error instanceof Error ? error.message : 'Failed to generate image preview');

// Line 128
toast.success('Image saved successfully');

// Line 144
toast.info('Preview discarded');
```

**ImageGenerationField Toast Usage** (process-generation-result.ts):
```typescript
// Lines 11-13
if (!result?.success) {
  toast.error(result?.error || 'Failed to generate image');
  return null;
}

// Lines 38-42
const enhancementNote = result.enhancedWithAI ? ' (AI enhanced)' : '';
const message = variations.length > 1
  ? `Generated ${variations.length} variations${enhancementNote}! Select your favorite.`
  : `Image generated successfully${enhancementNote}!`;
toast.success(message);
```

**ImageGenerationField Toast Usage** (image-source-selector.tsx):
```typescript
// Lines 32-33
if (!file.type.startsWith('image/')) {
  toast.error('Please upload an image file');
  return;
}

// Lines 35-38
if (file.size > 5 * 1024 * 1024) {
  toast.error('Image must be smaller than 5MB');
  return;
}

// Line 40
toast.success('Image uploaded successfully');
```

#### Extraction Plan

**Step 1**: Create `shared/image-management/utils/toast-messages.ts`
```typescript
import { toast } from 'sonner';

/**
 * Standard toast messages for image management operations
 */
export const imageToasts = {
  // Validation errors
  noFile: () => toast.error('Please select an image file first'),
  invalidFileType: () => toast.error('Please upload an image file'),
  fileTooLarge: (maxSizeMB: number = 5) =>
    toast.error(`Image must be smaller than ${maxSizeMB}MB`),
  noPodcast: () => toast.error('Episode has no associated podcast'),
  noPreview: () => toast.error('No preview image to save'),

  // Success messages
  uploadSuccess: () => toast.success('Image uploaded successfully'),
  generationSuccess: (count: number = 1, enhanced: boolean = false) => {
    const enhancementNote = enhanced ? ' (AI enhanced)' : '';
    const message = count > 1
      ? `Generated ${count} variations${enhancementNote}! Select your favorite.`
      : `Image generated successfully${enhancementNote}!`;
    return toast.success(message);
  },
  saveSuccess: () => toast.success('Image saved successfully'),
  deleteSuccess: () => toast.success('Image deleted successfully'),
  selectionSuccess: () => toast.success('Image selected!'),

  // Info messages
  previewDiscarded: () => toast.info('Preview discarded'),

  // Warning messages
  noPreviewProduced: () =>
    toast.warning('Image generation completed but no preview was produced'),
  noUrlReturned: () =>
    toast.warning('Image saving completed but no URL was returned'),

  // Error with custom message
  error: (message: string) => toast.error(message),

  // Error from exception
  errorFromException: (error: unknown, fallback: string) =>
    toast.error(error instanceof Error ? error.message : fallback)
};
```

**Step 2**: Update EpisodeImageManager (lines 37-77)
```typescript
const handleUpload = async () => {
  if (!selectedFile) {
    imageToasts.noFile();
    return;
  }

  if (!podcastId) {
    imageToasts.noPodcast();
    return;
  }

  setIsUploading(true);

  try {
    const formData = new FormData();
    formData.append('image', selectedFile);

    const response = await fetch(`/api/episodes/${episodeId}/upload-image`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to upload image');
    }

    setCurrentImage(result.imageUrl);
    setSelectedFile(null);
    imageToasts.uploadSuccess();
  } catch (error) {
    console.error('Error uploading image:', error);
    imageToasts.errorFromException(error, 'Failed to upload image');
  } finally {
    setIsUploading(false);
  }
};
```

**Time Estimate**: 1.5 hours
**Lines Saved**: ~12 lines, improves consistency
**Additional Benefit**: Centralized message management for future i18n

---

## 2. SIMILAR PATTERNS (60-80% Similarity)

### 2.1 Current Image Display

**EpisodeImageManager**: Lines 152-173
**ImageGenerationField**: `generated-image-preview.tsx` lines 13-46
**Similarity**: 70% - Similar structure, different styling
**Priority**: MEDIUM
**Extract Risk**: MEDIUM (different layout requirements)
**Testing Complexity**: MEDIUM

**EpisodeImageManager**:
```typescript
{currentImage && !previewImage && (
  <div className="space-y-2">
    <div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-md">
      <Image
        src={currentImage}
        alt={`${episodeTitle || 'Episode'} cover`}
        fill
        className="object-cover"
      />
    </div>
    <div className="mt-2">
      <a
        href={currentImage}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:underline"
      >
        View Full Image
      </a>
    </div>
  </div>
)}
```

**ImageGenerationField**:
```typescript
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label>Current Cover Image</Label>
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onDelete}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      <X className="h-4 w-4 mr-1" />
      Remove
    </Button>
  </div>
  <div className="relative w-full aspect-square max-w-xs rounded-lg overflow-hidden border">
    <Image
      src={currentImageUrl}
      alt="Current cover"
      fill
      className="object-cover"
    />
  </div>
</div>
```

**Recommendation**: Keep separate for now. ImageGenerationField has delete action, EpisodeImageManager has external link. Could merge with ImagePreviewCard if needed.

---

### 2.2 File Upload Validation

**EpisodeImageManager**: N/A (uses FileUpload component)
**ImageGenerationField**: `image-source-selector.tsx` lines 28-42
**Similarity**: 75% - Same validation logic, different implementation
**Priority**: MEDIUM
**Extract Risk**: LOW
**Testing Complexity**: LOW

**ImageGenerationField (image-source-selector.tsx)**:
```typescript
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }
    onFileUpload(file);
    toast.success('Image uploaded successfully');
  }
};
```

**FileUpload Component (used by EpisodeImageManager)**:
```typescript
// Validate file size (lines 47-53)
if (selectedFile.size > maxSize) {
  setError(`File size exceeds maximum limit (${(maxSize / 1024 / 1024).toFixed(1)}MB)`);
  setFile(null);
  onFileChange(null);
  return;
}
```

**Recommendation**: Extract validation logic to utility function, update both implementations.

**Extraction Plan**:

**Step 1**: Create `shared/image-management/utils/file-validation.ts`
```typescript
export const IMAGE_VALIDATION = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
} as const;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): FileValidationResult {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Please upload an image file'
    };
  }

  // Check file size
  if (file.size > IMAGE_VALIDATION.MAX_SIZE) {
    const sizeMB = (IMAGE_VALIDATION.MAX_SIZE / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `Image must be smaller than ${sizeMB}MB`
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}
```

**Step 2**: Update ImageSourceSelector
```typescript
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    onFileUpload(file);
    toast.success('Image uploaded successfully');
  }
};
```

**Time Estimate**: 1 hour
**Lines Saved**: ~8 lines, improves consistency

---

### 2.3 Error Handling Pattern

**EpisodeImageManager**: Lines 71-73, 100-102, 133-135
**ImageGenerationField**: Multiple files
**Similarity**: 80% - Same try-catch pattern
**Priority**: MEDIUM
**Extract Risk**: LOW
**Testing Complexity**: LOW

**Pattern**:
```typescript
try {
  // operation
} catch (error) {
  console.error('Error message:', error);
  toast.error(error instanceof Error ? error.message : 'Fallback message');
}
```

**Recommendation**: Extract to utility function in toast-messages.ts (already proposed above).

---

### 2.4 State Management Pattern

**EpisodeImageManager**: Lines 25-34
**ImageGenerationField**: `use-image-generation.ts` lines 19-25
**Similarity**: 65% - Similar loading states, different data structures
**Priority**: MEDIUM
**Extract Risk**: MEDIUM (different use cases)
**Testing Complexity**: MEDIUM

**EpisodeImageManager**:
```typescript
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [isUploading, setIsUploading] = useState(false);
const [isGenerating, setIsGenerating] = useState(false);
const [currentImage, setCurrentImage] = useState<string | null>(coverImage);
const [previewImage, setPreviewImage] = useState<string | null>(null);
const [isSavingPreview, setIsSavingPreview] = useState(false);
const [episodeDescription, setEpisodeDescription] = useState<string | null>(null);
const [generatedFromPrompt, setGeneratedFromPrompt] = useState<string | null>(null);
```

**ImageGenerationField**:
```typescript
const [isGenerating, setIsGenerating] = useState(false);
const [generatedVariations, setGeneratedVariations] = useState<GeneratedVariation[]>([]);
const [debugInfo, setDebugInfo] = useState<GenerationDebugInfo | null>(null);
const [showGallery, setShowGallery] = useState(false);
const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
const [isLoadingGallery, setIsLoadingGallery] = useState(false);
```

**Recommendation**: Keep separate. Different state models for different workflows. Could extract a shared `useLoadingState` hook if needed.

---

### 2.5 Image Generation API Call Pattern

**EpisodeImageManager**: Lines 85-105 (uses `generateEpisodeImagePreview`)
**ImageGenerationField**: `use-image-generation.ts` lines 41-119
**Similarity**: 60% - Different API endpoints, similar flow
**Priority**: MEDIUM
**Extract Risk**: HIGH (different APIs, different parameters)
**Testing Complexity**: HIGH

**Recommendation**: Keep separate. Episode uses server actions, Podcast uses form-bound actions. Different enough to warrant separate implementations.

---

## 3. UNIQUE FEATURES (Do NOT Extract)

### 3.1 EpisodeImageManager Unique Features

#### 3.1.1 File Upload via API Route
**Lines**: 37-77
**Reason**: Episode-specific, requires FormData upload to `/api/episodes/${episodeId}/upload-image`
**Dependencies**: Episode ID, Podcast ID validation

#### 3.1.2 Tabs-Based UI Structure
**Lines**: 244-302
**Reason**: Episode-specific UX pattern (Upload vs Generate tabs)
**Note**: ImageGenerationField uses radio buttons for source selection

#### 3.1.3 Save Preview Action
**Lines**: 109-138
**Reason**: Episode-specific workflow (preview → save → publish)
**API**: `saveEpisodeImagePreview(episodeId, previewImage)`

---

### 3.2 ImageGenerationField Unique Features

#### 3.2.1 Image Source Selection
**File**: `image-source-selector.tsx` (112 lines)
**Reason**: Podcast-specific (Telegram channel, upload, manual URL)
**Dependencies**: Podcast telegram_channel field

#### 3.2.2 Style Selection System
**File**: `style-selector.tsx` (80 lines)
**Reason**: Podcast-specific (saved styles, variation counts)
**Dependencies**: PODCAST_IMAGE_STYLES constant, podcast.image_style field

#### 3.2.3 Variation Gallery with A/B Testing
**File**: `variation-gallery.tsx` (75 lines)
**Reason**: Podcast-specific (multi-variation generation)
**Dependencies**: GeneratedVariation type, variation selection logic

#### 3.2.4 Gallery Browser (S3 History)
**File**: `gallery-browser.tsx` (107 lines)
**Reason**: Podcast-specific (browse previously generated images)
**Dependencies**: S3 gallery structure, podcast ID

#### 3.2.5 Debug Info Panel
**File**: `debug-info-panel.tsx` (83 lines)
**Reason**: Development/debugging feature for podcast generation
**Dependencies**: GenerationDebugInfo type, AI analysis data

#### 3.2.6 Gallery Operations Hook
**File**: `use-gallery-operations.ts` (70 lines)
**Reason**: Podcast-specific S3 gallery management
**API**: `listPodcastImagesGallery`, `deleteGalleryImage`

#### 3.2.7 Process Generation Result Utility
**File**: `process-generation-result.ts` (46 lines)
**Reason**: Podcast-specific result processing (variations, debug info)
**Dependencies**: Podcast generation API response format

#### 3.2.8 Variation Handlers
**File**: `variation-handlers.ts` (49 lines)
**Reason**: Podcast-specific variation selection/deletion logic
**Dependencies**: GeneratedVariation type, variation state management

---

## 4. EXTRACTION ROADMAP

### Phase 1: Quick Wins (HIGH Priority) - 4-6 hours

**Goal**: Extract pure utilities and commonly reused components
**Risk**: LOW
**Impact**: HIGH (immediate code reduction, better maintainability)

#### Step 1.1: Create Shared Directory Structure (15 min)
```bash
mkdir -p src/components/shared/image-management/{components,utils,hooks}
```

#### Step 1.2: Extract Toast Messages (1.5 hours)
- **File**: `src/components/shared/image-management/utils/toast-messages.ts`
- **Lines**: ~80 lines
- **Update**: EpisodeImageManager (~12 locations), ImageGenerationField (4 files)
- **Test**: Verify all toast messages work correctly
- **Breaking Risk**: LOW (simple string replacement)

#### Step 1.3: Extract File Validation (1 hour)
- **File**: `src/components/shared/image-management/utils/file-validation.ts`
- **Lines**: ~50 lines
- **Update**: ImageSourceSelector, FileUpload component
- **Test**: Test file upload with invalid types, oversized files
- **Breaking Risk**: LOW (pure utility function)

#### Step 1.4: Extract Loading Button Component (1 hour)
- **File**: `src/components/shared/image-management/components/loading-button.tsx`
- **Lines**: ~50 lines
- **Update**: EpisodeImageManager (3 buttons), ActionButtons
- **Test**: Test loading states, disabled states, different variants
- **Breaking Risk**: LOW (presentational component)

#### Step 1.5: Extract Image Preview Card Component (2 hours)
- **File**: `src/components/shared/image-management/components/image-preview-card.tsx`
- **Lines**: ~100 lines
- **Update**: EpisodeImageManager (lines 176-242)
- **Test**: Test with/without description, with/without prompt, different actions
- **Breaking Risk**: MEDIUM (conditional rendering logic)

**Total Time**: 5.5 hours
**Lines Extracted**: ~280 lines
**Lines Saved**: ~88 lines from EpisodeImageManager

---

### Phase 2: Additional Refinements (MEDIUM Priority) - Defer to Task 5.12

**Goal**: Further reduce duplication, improve consistency
**Risk**: MEDIUM
**Impact**: MEDIUM (incremental improvements)

#### Step 2.1: Extract Error Boundary Component (2 hours)
- Centralized error handling for image operations
- Consistent error UI across both components

#### Step 2.2: Extract useLoadingState Hook (1.5 hours)
- Shared loading state management
- Reduces boilerplate in both components

#### Step 2.3: Create Image Constants File (30 min)
- `MAX_FILE_SIZE`, `ACCEPTED_FORMATS`, etc.
- Single source of truth for validation

#### Step 2.4: Optimize Image Display Component (2 hours)
- Unified image display with configurable actions
- Merge current image display patterns

**Total Time**: 6 hours
**Deferred**: Yes (Task 5.12)

---

## 5. RISK ASSESSMENT

### 5.1 HIGH Priority Extractions Risk Analysis

#### Toast Messages Utility
- **Breaking Risk**: LOW
- **Testing Complexity**: LOW
- **Dependencies**: sonner (already installed)
- **Mitigation**: Simple string replacement, no behavior change
- **Rollback**: Easy (revert string literals)

#### File Validation Utility
- **Breaking Risk**: LOW
- **Testing Complexity**: LOW
- **Dependencies**: None (pure function)
- **Mitigation**: Comprehensive unit tests, validation against existing behavior
- **Rollback**: Easy (revert to inline validation)

#### Loading Button Component
- **Breaking Risk**: LOW
- **Testing Complexity**: LOW
- **Dependencies**: Button component (already exists)
- **Mitigation**: Props match existing button usage patterns
- **Rollback**: Easy (revert to inline button)

#### Image Preview Card Component
- **Breaking Risk**: MEDIUM
- **Testing Complexity**: MEDIUM
- **Dependencies**: Image, Button, Clipboard API
- **Mitigation**:
  - Preserve all existing functionality
  - Test with all prop combinations
  - Use TypeScript for type safety
- **Rollback**: Medium difficulty (conditional logic)

---

### 5.2 What NOT to Extract (High Risk Items)

#### API Integration Layer
**Reason**: Different endpoints, different patterns
- Episode: `/api/episodes/${id}/generate-image` (POST)
- Episode: `generateEpisodeImagePreview` (server action)
- Podcast: `generatePodcastImageFromTelegram/File/Url` (server actions)

**Risk**: HIGH (breaking changes to both systems)

#### State Management Logic
**Reason**: Different workflows, different data structures
- Episode: Simple preview → save workflow
- Podcast: Multi-variation selection, gallery management

**Risk**: HIGH (complex state interactions)

#### UI Layout Structure
**Reason**: Different UX patterns
- Episode: Tabs (Upload | Generate)
- Podcast: Radio buttons + modular components

**Risk**: MEDIUM (different user flows)

---

## 6. CODE SAMPLES FOR HIGH PRIORITY EXTRACTIONS

### 6.1 Complete Toast Messages Implementation

**File**: `src/components/shared/image-management/utils/toast-messages.ts`
```typescript
import { toast } from 'sonner';

/**
 * Standard toast messages for image management operations.
 * Centralizes all user-facing messages for consistency and future i18n support.
 */
export const imageToasts = {
  // ========================================
  // VALIDATION ERRORS
  // ========================================

  noFile: () => toast.error('Please select an image file first'),

  invalidFileType: () => toast.error('Please upload an image file'),

  fileTooLarge: (maxSizeMB: number = 5) =>
    toast.error(`Image must be smaller than ${maxSizeMB}MB`),

  noPodcast: () => toast.error('Episode has no associated podcast'),

  noPreview: () => toast.error('No preview image to save'),

  noTelegramChannel: () => toast.error('No Telegram channel configured'),

  noImageUrl: () => toast.error('Please enter an image URL'),

  savePodcastFirst: () => toast.error('Please save the podcast first'),

  // ========================================
  // SUCCESS MESSAGES
  // ========================================

  uploadSuccess: () => toast.success('Image uploaded successfully'),

  generationSuccess: (count: number = 1, enhanced: boolean = false) => {
    const enhancementNote = enhanced ? ' (AI enhanced)' : '';
    const message = count > 1
      ? `Generated ${count} variations${enhancementNote}! Select your favorite.`
      : `Image generated successfully${enhancementNote}!`;
    return toast.success(message);
  },

  saveSuccess: () => toast.success('Image saved successfully'),

  deleteSuccess: () => toast.success('Image deleted successfully'),

  variationDeleted: (wasSelected: boolean) => {
    const message = wasSelected
      ? 'Variation deleted. First variation selected.'
      : 'Variation deleted';
    return toast.success(message);
  },

  selectionSuccess: () => toast.success('Image selected!'),

  galleryLoadSuccess: (count: number) =>
    toast.success(`Found ${count} images in gallery`),

  imageSelectedFromGallery: () =>
    toast.success('Image selected from gallery!'),

  imageRemoved: () => toast.success('Image removed'),

  // ========================================
  // INFO MESSAGES
  // ========================================

  previewDiscarded: () => toast.info('Preview discarded'),

  galleryEmpty: () =>
    toast.info('No images found in gallery. Generate some images first!'),

  // ========================================
  // WARNING MESSAGES
  // ========================================

  noPreviewProduced: () =>
    toast.warning('Image generation completed but no preview was produced'),

  noUrlReturned: () =>
    toast.warning('Image saving completed but no URL was returned'),

  // ========================================
  // GENERIC ERROR HANDLERS
  // ========================================

  error: (message: string) => toast.error(message),

  errorFromException: (error: unknown, fallback: string) =>
    toast.error(error instanceof Error ? error.message : fallback),

  loadGalleryError: (error?: string) =>
    toast.error(error || 'Failed to load gallery'),

  deleteGalleryImageError: (error?: string) =>
    toast.error(error || 'Failed to delete image'),
} as const;
```

**Usage in EpisodeImageManager**:
```typescript
import { imageToasts } from '@/components/shared/image-management/utils/toast-messages';

// Before
toast.error('Please select an image file first');

// After
imageToasts.noFile();

// Before
toast.success('Image uploaded successfully');

// After
imageToasts.uploadSuccess();

// Before
toast.error(error instanceof Error ? error.message : 'Failed to upload image');

// After
imageToasts.errorFromException(error, 'Failed to upload image');
```

---

### 6.2 Complete File Validation Implementation

**File**: `src/components/shared/image-management/utils/file-validation.ts`
```typescript
/**
 * File validation utilities for image upload operations
 */

export const IMAGE_VALIDATION = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_SIZE_MB: 5,
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ACCEPTED_MIME_PREFIX: 'image/'
} as const;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates an image file for type and size constraints
 *
 * @param file - The file to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateImageFile(file: File): FileValidationResult {
  // Check file type
  if (!file.type.startsWith(IMAGE_VALIDATION.ACCEPTED_MIME_PREFIX)) {
    return {
      valid: false,
      error: 'Please upload an image file'
    };
  }

  // Check file size
  if (file.size > IMAGE_VALIDATION.MAX_SIZE) {
    return {
      valid: false,
      error: `Image must be smaller than ${IMAGE_VALIDATION.MAX_SIZE_MB}MB`
    };
  }

  return { valid: true };
}

/**
 * Validates an image file with custom size limit
 *
 * @param file - The file to validate
 * @param maxSizeBytes - Maximum file size in bytes
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateImageFileWithSize(
  file: File,
  maxSizeBytes: number
): FileValidationResult {
  // Check file type
  if (!file.type.startsWith(IMAGE_VALIDATION.ACCEPTED_MIME_PREFIX)) {
    return {
      valid: false,
      error: 'Please upload an image file'
    };
  }

  // Check file size
  if (file.size > maxSizeBytes) {
    const sizeMB = (maxSizeBytes / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `Image must be smaller than ${sizeMB}MB`
    };
  }

  return { valid: true };
}

/**
 * Formats file size in human-readable format
 *
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "2.5 MB", "156 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}

/**
 * Checks if a file is an accepted image type
 *
 * @param file - The file to check
 * @returns True if file is an accepted image type
 */
export function isAcceptedImageType(file: File): boolean {
  return file.type.startsWith(IMAGE_VALIDATION.ACCEPTED_MIME_PREFIX);
}

/**
 * Gets a human-readable string of accepted formats
 *
 * @returns String like "JPG, PNG, WebP"
 */
export function getAcceptedFormatsString(): string {
  return IMAGE_VALIDATION.ACCEPTED_TYPES
    .map(type => type.split('/')[1].toUpperCase())
    .join(', ');
}
```

**Usage in ImageSourceSelector**:
```typescript
import { validateImageFile } from '@/components/shared/image-management/utils/file-validation';
import { imageToasts } from '@/components/shared/image-management/utils/toast-messages';

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      imageToasts.error(validation.error!);
      return;
    }
    onFileUpload(file);
    imageToasts.uploadSuccess();
  }
};
```

**Usage in FileUpload Component**:
```typescript
import { validateImageFileWithSize, formatFileSize } from '@/components/shared/image-management/utils/file-validation';

const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
  const selectedFile = e.target.files?.[0] || null;

  setError(null);
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  if (!selectedFile) {
    setFile(null);
    onFileChange(null);
    return;
  }

  // Validate with custom max size
  const validation = validateImageFileWithSize(selectedFile, maxSize);
  if (!validation.valid) {
    setError(validation.error!);
    setFile(null);
    onFileChange(null);
    return;
  }

  // Create preview for images
  if (selectedFile.type.startsWith('image/')) {
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  }

  setFile(selectedFile);
  onFileChange(selectedFile);
};
```

---

### 6.3 Complete Loading Button Implementation

**File**: `src/components/shared/image-management/components/loading-button.tsx`
```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps {
  /** Whether the button is in loading state */
  isLoading: boolean;

  /** Text to display when loading */
  loadingText: string;

  /** Custom icon to display when loading (defaults to spinning Loader2) */
  loadingIcon?: React.ReactNode;

  /** Text to display when idle */
  idleText: string | React.ReactNode;

  /** Icon to display when idle */
  idleIcon?: React.ReactNode;

  /** Click handler */
  onClick: () => void;

  /** Additional disabled state (in addition to loading) */
  disabled?: boolean;

  /** Custom className */
  className?: string;

  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';

  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';

  /** Button type */
  type?: 'button' | 'submit' | 'reset';
}

/**
 * A button component that displays loading state with spinner.
 * Automatically disables interaction while loading.
 *
 * @example
 * <LoadingButton
 *   isLoading={isUploading}
 *   loadingText="Uploading..."
 *   idleText="Upload Image"
 *   onClick={handleUpload}
 *   disabled={!selectedFile}
 * />
 */
export function LoadingButton({
  isLoading,
  loadingText,
  loadingIcon,
  idleText,
  idleIcon,
  onClick,
  disabled = false,
  className = 'w-full',
  variant = 'default',
  size = 'default',
  type = 'button'
}: LoadingButtonProps) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={className}
      variant={variant}
      size={size}
    >
      {isLoading ? (
        <>
          {loadingIcon || <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loadingText}
        </>
      ) : (
        <>
          {idleIcon}
          {idleText}
        </>
      )}
    </Button>
  );
}
```

**Usage in EpisodeImageManager**:
```typescript
import { LoadingButton } from '@/components/shared/image-management/components/loading-button';
import { RefreshCw } from 'lucide-react';

// Replace lines 265-278
<LoadingButton
  isLoading={isUploading}
  loadingText="Uploading..."
  loadingIcon={<RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
  idleText="Upload Image"
  onClick={handleUpload}
  disabled={!selectedFile}
  className="w-full"
/>

// Replace lines 286-299
<LoadingButton
  isLoading={isGenerating}
  loadingText="Generating Preview..."
  loadingIcon={<RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
  idleText="Generate Preview"
  onClick={handleGeneratePreview}
  className="w-full"
/>
```

**Usage in ActionButtons**:
```typescript
import { LoadingButton } from '@/components/shared/image-management/components/loading-button';
import { Sparkles, Images } from 'lucide-react';

<div className="flex flex-col sm:flex-row gap-3">
  <LoadingButton
    type="button"
    isLoading={isGenerating}
    loadingText={`Generating ${variationCount > 1 ? `${variationCount} variations` : 'image'}...`}
    idleText={
      <>
        Generate with AI {selectedVariationLabel && `(${selectedVariationLabel})`}
      </>
    }
    idleIcon={<Sparkles className="mr-2 h-4 w-4" />}
    onClick={onGenerate}
    className="flex-1 w-full sm:w-auto"
  />

  <LoadingButton
    type="button"
    isLoading={isLoadingGallery}
    loadingText="Loading..."
    idleText="Browse Gallery"
    idleIcon={<Images className="mr-2 h-4 w-4" />}
    onClick={onLoadGallery}
    variant="outline"
    className="flex-1 w-full sm:w-auto"
  />
</div>
```

---

## 7. TESTING STRATEGY

### 7.1 Unit Tests for Extracted Utilities

**File**: `src/components/shared/image-management/utils/__tests__/file-validation.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { validateImageFile, formatFileSize, IMAGE_VALIDATION } from '../file-validation';

describe('validateImageFile', () => {
  it('should accept valid image files', () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const result = validateImageFile(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject non-image files', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Please upload an image file');
  });

  it('should reject oversized files', () => {
    const largeFile = new File(
      [new ArrayBuffer(IMAGE_VALIDATION.MAX_SIZE + 1)],
      'large.jpg',
      { type: 'image/jpeg' }
    );
    const result = validateImageFile(largeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('5MB');
  });
});

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500 bytes');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });
});
```

### 7.2 Integration Tests

**Manual Testing Checklist**:

#### EpisodeImageManager Tests
- [ ] Upload valid image file → success toast, preview displayed
- [ ] Upload invalid file type → error toast
- [ ] Upload oversized file → error toast
- [ ] Generate preview → loading state, success toast, preview displayed
- [ ] Save preview → loading state, success toast, image updated
- [ ] Discard preview → preview cleared, info toast
- [ ] View full image link → opens in new tab

#### ImageGenerationField Tests
- [ ] Generate from Telegram → loading state, variations displayed
- [ ] Generate from upload → file validation, generation success
- [ ] Generate from URL → validation, generation success
- [ ] Select variation → selection indicator, success toast
- [ ] Delete variation → reindexing, selection handling
- [ ] Browse gallery → images loaded, display correct
- [ ] Select from gallery → image applied, gallery closed
- [ ] Delete from gallery → confirmation, removal

### 7.3 Regression Prevention

**Areas to Monitor**:
1. **Toast Message Consistency**: All toasts use imageToasts utility
2. **File Validation**: Both upload paths use shared validation
3. **Loading States**: All buttons use LoadingButton component
4. **Image Display**: Preview cards render correctly with all prop combinations

---

## 8. RECOMMENDATIONS

### 8.1 Immediate Actions (Task 5.11)

✅ **PROCEED WITH QUICK WINS**:
1. Extract toast messages utility (1.5 hours)
2. Extract file validation utility (1 hour)
3. Extract loading button component (1 hour)
4. Extract image preview card component (2 hours)

**Total Effort**: 5.5 hours
**Risk**: LOW to MEDIUM
**Benefit**: Immediate code reduction, improved consistency

### 8.2 Deferred Actions (Task 5.12)

⏸️ **DEFER MEDIUM PRIORITY ITEMS**:
1. Error boundary component
2. useLoadingState hook
3. Image constants file
4. Optimized image display component

**Total Effort**: 6 hours
**Risk**: MEDIUM
**Benefit**: Incremental improvements

### 8.3 What NOT to Do

❌ **DO NOT ATTEMPT**:
1. **Merge API layers** - Too different, high breaking risk
2. **Merge state management** - Different workflows
3. **Merge UI layouts** - Different UX patterns
4. **Extract unique features** - No reuse benefit

---

## 9. SUCCESS METRICS

### 9.1 Code Reduction Targets

**Before Refactoring**:
- EpisodeImageManager: 305 lines
- ImageGenerationField: 1,043 lines
- **Total**: 1,348 lines

**After Phase 1 (Quick Wins)**:
- Shared utilities: ~180 lines (new)
- Shared components: ~150 lines (new)
- EpisodeImageManager: ~217 lines (-88 lines)
- ImageGenerationField: ~1,013 lines (-30 lines)
- **Total**: 1,560 lines (+212 lines)

**Net Result**: Small increase due to shared code, but:
- ✅ Better maintainability
- ✅ Consistent behavior
- ✅ Easier testing
- ✅ Future reusability

### 9.2 Quality Metrics

**Target Improvements**:
- [ ] 100% toast message consistency
- [ ] Shared file validation logic
- [ ] Reduced button component duplication
- [ ] Standardized image preview rendering
- [ ] Zero new bugs introduced
- [ ] All existing tests passing

---

## 10. MIGRATION GUIDE

### 10.1 Step-by-Step Migration

**Day 1 (2 hours)**:
1. Create shared directory structure
2. Extract and test toast messages utility
3. Update EpisodeImageManager to use toast messages
4. Update ImageGenerationField files to use toast messages
5. Run manual tests, verify no regressions

**Day 2 (2 hours)**:
1. Extract file validation utility
2. Update ImageSourceSelector
3. Update FileUpload component (if needed)
4. Run file upload tests

**Day 3 (1.5 hours)**:
1. Extract LoadingButton component
2. Update EpisodeImageManager buttons
3. Update ActionButtons
4. Test all loading states

**Day 4 (2 hours)**:
1. Extract ImagePreviewCard component
2. Update EpisodeImageManager preview section
3. Test all preview scenarios
4. Final regression testing

### 10.2 Rollback Plan

**If Issues Arise**:
1. Revert commits for problematic extraction
2. Keep successful extractions
3. Document issues for future resolution
4. Continue with remaining extractions

---

## APPENDIX A: File Structure After Refactoring

```
src/components/shared/image-management/
├── components/
│   ├── loading-button.tsx          (NEW - 50 lines)
│   ├── image-preview-card.tsx      (NEW - 100 lines)
│   └── index.ts                     (NEW - exports)
├── utils/
│   ├── toast-messages.ts            (NEW - 80 lines)
│   ├── file-validation.ts           (NEW - 50 lines)
│   └── index.ts                     (NEW - exports)
└── README.md                         (NEW - usage docs)

src/components/admin/
├── episode-image-manager.tsx        (UPDATED - 217 lines, was 305)
└── podcast-form/image-generation/
    ├── image-source-selector.tsx    (UPDATED - uses shared validation)
    ├── action-buttons.tsx           (UPDATED - uses LoadingButton)
    └── (13 other files unchanged)
```

---

## APPENDIX B: Import Changes Reference

### Before (EpisodeImageManager)
```typescript
import { toast } from 'sonner';
```

### After (EpisodeImageManager)
```typescript
import { imageToasts } from '@/components/shared/image-management/utils/toast-messages';
import { LoadingButton } from '@/components/shared/image-management/components/loading-button';
import { ImagePreviewCard } from '@/components/shared/image-management/components/image-preview-card';
```

### Before (ImageSourceSelector)
```typescript
import { toast } from 'sonner';
```

### After (ImageSourceSelector)
```typescript
import { imageToasts } from '@/components/shared/image-management/utils/toast-messages';
import { validateImageFile } from '@/components/shared/image-management/utils/file-validation';
```

---

## CONCLUSION

This analysis identified **3 HIGH priority** and **4 MEDIUM priority** extraction opportunities totaling approximately **11-12 hours of work**.

**Recommended Approach**: Execute Phase 1 (Quick Wins) in Task 5.11, defer Phase 2 to Task 5.12.

**Key Takeaway**: While we're adding ~180 lines of shared code, we're **eliminating 118 lines of duplicates** and creating a **reusable foundation** for future image management features. The real benefit is in maintainability, consistency, and reduced cognitive load when working with either component.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-14
**Status**: Ready for Review
