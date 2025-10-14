# Shared Image Management Components

This directory contains shared components, hooks, and utilities for image management operations across the Podcasto admin interface.

## 📦 Contents

- **components/** - Reusable UI components for image operations
- **hooks/** - Custom React hooks for state management
- **utils/** - Pure utility functions for validation and messaging
- **types.ts** - TypeScript type definitions
- **constants.ts** - Configuration constants
- **index.ts** - Main exports

## 🎯 Purpose

Eliminates code duplication between:
- **EpisodeImageManager** (Episode cover images)
- **ImageGenerationField** (Podcast cover images)

## 🚀 Quick Start

### Import Everything
```typescript
import {
  // Components
  LoadingButton,
  ImagePreviewCard,
  CurrentImageDisplay,

  // Hooks
  useLoadingState,
  useImageUpload,
  useImageState,

  // Utils
  validateImageFile,
  imageToasts,

  // Constants
  IMAGE_VALIDATION
} from '@/components/admin/shared/image-management';
```

### Or Import Selectively
```typescript
import { LoadingButton } from '@/components/admin/shared/image-management/components';
import { imageToasts } from '@/components/admin/shared/image-management/utils';
```

## 📚 Components

### LoadingButton
A button with built-in loading state and spinner.

```typescript
<LoadingButton
  isLoading={isUploading}
  loadingText="Uploading..."
  idleText="Upload Image"
  onClick={handleUpload}
  disabled={!file}
/>
```

**Props**:
- `isLoading: boolean` - Shows loading spinner when true
- `loadingText: string` - Text during loading
- `idleText: string | ReactNode` - Text when idle
- `loadingIcon?: ReactNode` - Custom loading icon (default: Loader2 spinner)
- `idleIcon?: ReactNode` - Icon when idle
- `onClick: () => void` - Click handler
- `disabled?: boolean` - Additional disabled state
- `className?: string` - Custom styles
- `variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary'`
- `size?: 'default' | 'sm' | 'lg' | 'icon'`
- `type?: 'button' | 'submit' | 'reset'`

---

### ImagePreviewCard
Displays an image with optional description, AI prompt, and action buttons.

```typescript
<ImagePreviewCard
  imageUrl={previewUrl}
  alt="Generated preview"
  description={episodeDescription}
  prompt={aiPrompt}
  actions={
    <>
      <Button onClick={handleSave}>Save</Button>
      <Button onClick={handleDiscard}>Discard</Button>
    </>
  }
/>
```

**Props**:
- `imageUrl: string` - Image URL to display
- `alt?: string` - Alt text (default: "Generated image")
- `description?: string | null` - Optional description text (truncated)
- `prompt?: string | null` - AI prompt with copy button
- `actions?: ReactNode` - Button group to render
- `maxDescriptionLength?: number` - Max chars before truncation (default: 200)
- `className?: string` - Custom container styles

**Features**:
- Auto-truncates long descriptions
- Copy-to-clipboard for AI prompts
- Flexible action button slot
- Responsive design (max-width: 300px)

---

### CurrentImageDisplay
Shows the current saved image with optional remove/view actions.

```typescript
<CurrentImageDisplay
  imageUrl={currentImage}
  alt="Episode cover"
  label="Current Episode Cover"
  showRemove
  onRemove={handleRemove}
  showViewLink
/>
```

**Props**:
- `imageUrl: string` - Image URL to display
- `alt?: string` - Alt text (default: "Current image")
- `label?: string` - Label text (default: "Current Cover Image")
- `showRemove?: boolean` - Show remove button (default: false)
- `onRemove?: () => void` - Remove button handler
- `showViewLink?: boolean` - Show "View Full Image" link (default: false)
- `className?: string` - Custom container styles

**Features**:
- Label with optional remove button
- Opens image in new tab (if showViewLink)
- Consistent styling with PreviewCard

## 🪝 Hooks

### useLoadingState
Manages multiple loading states for image operations.

```typescript
const {
  isUploading,
  isGenerating,
  isSaving,
  isDeleting,
  setIsUploading,
  setIsGenerating,
  setIsSaving,
  setIsDeleting,
  isAnyLoading,
  resetAll
} = useLoadingState();
```

**Returns**:
- Individual loading flags (boolean)
- Setter functions for each flag
- `isAnyLoading: boolean` - True if any operation is loading
- `resetAll: () => void` - Resets all flags to false

---

### useImageUpload
Handles file selection, validation, and base64 conversion.

```typescript
const {
  selectedFile,
  filePreview,
  selectFile,
  validateAndSelectFile,
  clearFile,
  convertToBase64
} = useImageUpload();
```

**Returns**:
- `selectedFile: File | null` - Currently selected file
- `filePreview: string | null` - Preview URL (auto-cleaned on unmount)
- `selectFile: (file: File | null) => void` - Manually select file
- `validateAndSelectFile: (file: File) => boolean` - Validate then select
- `clearFile: () => void` - Clear file and preview
- `convertToBase64: (file: File) => Promise<string>` - Convert to base64

**Features**:
- Auto-validates on select
- Shows toast errors
- Auto-creates preview URLs
- Cleans up URLs on unmount

---

### useImageState
Manages current and preview image states.

```typescript
const {
  currentImage,
  previewImage,
  hasPreview,
  setCurrentImage,
  setPreviewImage,
  clearPreview,
  promotePreviewToCurrent
} = useImageState(initialImage);
```

**Params**:
- `initialImage?: string | null` - Initial current image URL

**Returns**:
- `currentImage: string | null` - Current saved image
- `previewImage: string | null` - Preview/temporary image
- `hasPreview: boolean` - True if preview exists
- `setCurrentImage: (url: string | null) => void`
- `setPreviewImage: (url: string | null) => void`
- `clearPreview: () => void` - Clear preview only
- `promotePreviewToCurrent: () => void` - Move preview to current

**Use Case**: Save/discard workflows

## 🛠️ Utilities

### File Validation

```typescript
import { validateImageFile, IMAGE_VALIDATION } from '@/components/admin/shared/image-management';

const validation = validateImageFile(file);
if (!validation.valid) {
  console.error(validation.error);
}

// Constants
IMAGE_VALIDATION.MAX_SIZE        // 5242880 (5MB)
IMAGE_VALIDATION.MAX_SIZE_MB     // 5
IMAGE_VALIDATION.ACCEPTED_TYPES  // ['image/jpeg', 'image/png', ...]
```

**Functions**:
- `validateImageFile(file: File): FileValidationResult`
- `validateImageFileWithSize(file: File, maxBytes: number): FileValidationResult`
- `formatFileSize(bytes: number): string` - Returns "2.5 MB", "156 KB", etc.
- `isAcceptedImageType(file: File): boolean`
- `getAcceptedFormatsString(): string` - Returns "JPG, PNG, WebP"

---

### Toast Messages

```typescript
import { imageToasts } from '@/components/admin/shared/image-management';

// Validation errors
imageToasts.noFile();
imageToasts.invalidFileType();
imageToasts.fileTooLarge(5);
imageToasts.noPodcast();
imageToasts.noPreview();
imageToasts.noTelegramChannel();
imageToasts.noImageUrl();
imageToasts.savePodcastFirst();

// Success messages
imageToasts.uploadSuccess();
imageToasts.generationSuccess(count, enhanced);
imageToasts.saveSuccess();
imageToasts.deleteSuccess();
imageToasts.selectionSuccess();
imageToasts.galleryLoadSuccess(count);
imageToasts.imageSelectedFromGallery();
imageToasts.imageRemoved();
imageToasts.variationDeleted(wasSelected);

// Info/Warning
imageToasts.previewDiscarded();
imageToasts.galleryEmpty();
imageToasts.noPreviewProduced();
imageToasts.noUrlReturned();

// Generic errors
imageToasts.error(message);
imageToasts.errorFromException(error, fallback);
imageToasts.loadGalleryError(error?);
imageToasts.deleteGalleryImageError(error?);
```

**Benefits**:
- Consistent messaging across all components
- Easy to update for i18n
- Single source of truth
- Type-safe

## 📋 Types

```typescript
interface ImageState {
  current: string | null;
  preview: string | null;
  hasModifications: boolean;
}

interface LoadingStates {
  isUploading: boolean;
  isGenerating: boolean;
  isSaving: boolean;
  isDeleting?: boolean;
}

interface UploadConfig {
  maxSize: number;
  acceptedTypes: string[];
  endpoint?: string;
}

interface ImageActions {
  onUpload?: (file: File) => void | Promise<void>;
  onGenerate?: () => void | Promise<void>;
  onSave?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onDiscard?: () => void;
}

interface FileValidationResult {
  valid: boolean;
  error?: string;
}
```

## 🎨 Usage Examples

### Example 1: Simple Upload Button
```typescript
const { isUploading, setIsUploading } = useLoadingState();

const handleUpload = async () => {
  setIsUploading(true);
  try {
    // ... upload logic
    imageToasts.uploadSuccess();
  } catch (error) {
    imageToasts.errorFromException(error, 'Failed to upload');
  } finally {
    setIsUploading(false);
  }
};

return (
  <LoadingButton
    isLoading={isUploading}
    loadingText="Uploading..."
    idleText="Upload Image"
    onClick={handleUpload}
  />
);
```

### Example 2: File Selection with Validation
```typescript
const { validateAndSelectFile, selectedFile } = useImageUpload();

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const isValid = validateAndSelectFile(file); // Auto-shows toast errors
    if (isValid) {
      // Proceed with upload
    }
  }
};
```

### Example 3: Preview with Save/Discard
```typescript
const { currentImage, previewImage, setPreviewImage, promotePreviewToCurrent, clearPreview } = useImageState(initialImage);
const { isSaving, setIsSaving } = useLoadingState();

const handleSave = async () => {
  if (!previewImage) {
    imageToasts.noPreview();
    return;
  }

  setIsSaving(true);
  try {
    await saveImage(previewImage);
    promotePreviewToCurrent();
    imageToasts.saveSuccess();
  } catch (error) {
    imageToasts.errorFromException(error, 'Failed to save');
  } finally {
    setIsSaving(false);
  }
};

const handleDiscard = () => {
  clearPreview();
  imageToasts.previewDiscarded();
};

return (
  <>
    {currentImage && !previewImage && (
      <CurrentImageDisplay
        imageUrl={currentImage}
        alt="Current cover"
        showViewLink
      />
    )}

    {previewImage && (
      <ImagePreviewCard
        imageUrl={previewImage}
        alt="Preview"
        actions={
          <>
            <LoadingButton
              isLoading={isSaving}
              loadingText="Saving..."
              idleText="Save"
              onClick={handleSave}
            />
            <Button onClick={handleDiscard} variant="outline">
              Discard
            </Button>
          </>
        }
      />
    )}
  </>
);
```

## 🔧 Maintenance

### Adding a New Toast Message
1. Add to `utils/toast-messages.ts`:
```typescript
export const imageToasts = {
  // ...existing messages
  myNewMessage: (param?: string) => toast.info(`New message: ${param}`)
} as const;
```

2. Use anywhere:
```typescript
imageToasts.myNewMessage('Hello!');
```

### Creating a New Shared Component
1. Create file in `components/my-component.tsx`
2. Export from `components/index.ts`
3. Document in this README
4. Update main `index.ts` export

### Adding a New Hook
1. Create file in `hooks/use-my-hook.ts`
2. Export from `hooks/index.ts`
3. Document in this README
4. Update main `index.ts` export

## 📝 Contributing

When adding to this shared library:
1. ✅ Keep components generic and reusable
2. ✅ Document all props and return values
3. ✅ Provide usage examples
4. ✅ Add TypeScript types
5. ✅ Follow existing naming conventions
6. ✅ Update this README
7. ✅ Test with both EpisodeImageManager and ImageGenerationField

## 🐛 Troubleshooting

**Problem**: Import not found
```typescript
// ❌ Wrong
import { LoadingButton } from '@/components/admin/shared/image-management/loading-button';

// ✅ Correct
import { LoadingButton } from '@/components/admin/shared/image-management';
```

**Problem**: Toast not showing
- Make sure `Toaster` component is mounted (usually in root layout)
- Check browser console for errors

**Problem**: Validation not working
- Ensure you're using `validateAndSelectFile()` not `selectFile()`
- Check that file is actually a `File` object

## 📊 Coverage

**Used By**:
- ✅ `EpisodeImageManager` (Episode covers)
- ✅ `ImageGenerationField` (Podcast covers)
- 🔜 Future image management features

**Test Coverage**:
- Components: Manual testing (both implementations)
- Utils: Can add unit tests
- Hooks: Integration tested via components

---

**Created**: 2025-10-14
**Last Updated**: 2025-10-14
**Version**: 1.0.0
