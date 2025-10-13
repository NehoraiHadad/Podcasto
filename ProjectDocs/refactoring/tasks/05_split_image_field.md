# משימה 5.1: Split Image Generation Field Component

## מטרה
פיצול `image-generation-field.tsx` (730 שורות!) ל-6 קומפוננטים קטנים

## עדיפות: 🔴 גבוהה | זמן: 4 שעות | תחום: UI Components (05)

---

## 📊 Current Monolith

**File**: `components/admin/podcast-form/image-generation-field.tsx`
**Size**: 730 שורות - הקובץ הגדול ביותר בפרויקט!
**Problem**: קומפוננט אחד עושה הכל:
- Source selection (Telegram/Upload/URL)
- Style selection
- Generation controls
- Variations gallery
- Image preview
- Gallery browser

---

## 🎯 Proposed Structure

```
components/admin/podcast-form/image-field/
├── ImageGenerationField.tsx      (~100 שורות) - Main orchestrator
├── ImageSourceSelector.tsx       (~60 שורות)
├── StyleSelector.tsx             (~60 שורות)
├── GenerationControls.tsx        (~80 שורות)
├── VariationsGallery.tsx         (~100 שורות)
├── ImagePreview.tsx              (~60 שורות)
├── GalleryBrowser.tsx            (~120 שורות)
├── types.ts                      (~30 שורות)
└── hooks/
    ├── useImageGeneration.ts     (~80 שורות) - State logic
    └── useGallery.ts             (~60 שורות) - Gallery logic
```

---

## 📚 React Composition Patterns (2025)

**Resources:**
- https://medium.com/@orami98/8-revolutionary-react-server-components-patterns-that-will-replace-your-client-side-rendering-in-be24e50236e2
- https://www.joshwcomeau.com/react/server-components/

**Key Pattern: Compound Components**
```tsx
<ImageField podcastId={id}>
  <ImageField.Source />
  <ImageField.StyleSelector />
  <ImageField.Generator />
  <ImageField.Preview />
</ImageField>
```

**Benefits:**
- Flexibility in layout
- Clear component hierarchy
- Easy to extend
- Type-safe composition

---

## 📝 Implementation Steps

### 1. Extract Types & State Logic (~1 hour)

**File**: `types.ts`
```typescript
export type ImageSource = 'telegram' | 'upload' | 'url';

export interface GeneratedVariation {
  url: string;
  base64Data: string;
  index: number;
  selected: boolean;
}

export interface ImageFieldProps {
  podcastId?: string;
  currentImageUrl?: string | null;
  telegramChannel?: string | null;
  onImageGenerated?: (imageUrl: string) => void;
}

export interface UseImageGenerationReturn {
  isGenerating: boolean;
  imageSource: ImageSource;
  setImageSource: (source: ImageSource) => void;
  selectedStyle: string;
  setSelectedStyle: (style: string) => void;
  variationCount: number;
  setVariationCount: (count: number) => void;
  generatedVariations: GeneratedVariation[];
  handleGenerate: () => Promise<void>;
  handleSelectVariation: (index: number) => void;
}
```

**File**: `hooks/useImageGeneration.ts`
```typescript
'use client';

import { useState } from 'react';
import { generatePodcastImageFromTelegram } from '@/lib/actions/podcast';

export function useImageGeneration(props: ImageFieldProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageSource, setImageSource] = useState<ImageSource>('telegram');
  const [selectedStyle, setSelectedStyle] = useState('modern-professional');
  // ... all state logic here

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Call server action
      const result = await generatePodcastImageFromTelegram(props.podcastId, {
        style: selectedStyle,
        variationsCount
      });
      // Handle result
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    imageSource,
    setImageSource,
    selectedStyle,
    setSelectedStyle,
    handleGenerate,
    // ... more
  };
}
```

### 2. Create Sub-Components (~2 hours)

**File**: `ImageSourceSelector.tsx` (~60 lines)
```tsx
'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { ImageSource } from './types';

interface Props {
  value: ImageSource;
  onChange: (value: ImageSource) => void;
  telegramChannel?: string | null;
}

export function ImageSourceSelector({ value, onChange, telegramChannel }: Props) {
  return (
    <div className="space-y-3">
      <Label>Image Source</Label>
      <RadioGroup value={value} onValueChange={onChange}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="telegram" disabled={!telegramChannel} />
          <Label htmlFor="telegram" className="font-normal cursor-pointer">
            Auto from Telegram {telegramChannel && `(@${telegramChannel})`}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="upload" />
          <Label htmlFor="upload">Upload Image File</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="url" />
          <Label htmlFor="url">Manual URL</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
```

**File**: `StyleSelector.tsx` (~60 lines)
```tsx
'use client';

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { PODCAST_IMAGE_STYLES } from '@/lib/constants/podcast-image-styles';

interface Props {
  value: string;
  onChange: (value: string) => void;
  savedStyle?: string | null;
}

export function StyleSelector({ value, onChange, savedStyle }: Props) {
  const selectedStyle = PODCAST_IMAGE_STYLES.find(s => s.id === value);

  return (
    <div className="space-y-2">
      <Label>Image Style</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PODCAST_IMAGE_STYLES.map((style) => (
            <SelectItem key={style.id} value={style.id}>
              {style.label} {savedStyle === style.id && ' ✓'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedStyle && (
        <p className="text-sm text-muted-foreground">
          {selectedStyle.description}
        </p>
      )}
    </div>
  );
}
```

**File**: `GenerationControls.tsx` (~80 lines)
```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Images } from 'lucide-react';

interface Props {
  isGenerating: boolean;
  onGenerate: () => void;
  onOpenGallery: () => void;
  variationCount: number;
}

export function GenerationControls({
  isGenerating,
  onGenerate,
  onOpenGallery,
  variationCount
}: Props) {
  return (
    <div className="flex gap-3">
      <Button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="flex-1"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating {variationCount > 1 && `${variationCount} variations`}...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate with AI
          </>
        )}
      </Button>

      <Button
        type="button"
        onClick={onOpenGallery}
        variant="outline"
        className="flex-1"
      >
        <Images className="mr-2 h-4 w-4" />
        Browse Gallery
      </Button>
    </div>
  );
}
```

**File**: `VariationsGallery.tsx` (~100 lines)
```tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import Image from 'next/image';
import type { GeneratedVariation } from './types';

interface Props {
  variations: GeneratedVariation[];
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
}

export function VariationsGallery({ variations, onSelect, onDelete }: Props) {
  if (variations.length === 0) return null;

  return (
    <div className="space-y-3">
      <Label>Generated Variations - Select One</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {variations.map((variation) => (
          <Card
            key={variation.index}
            className={`transition-all ${
              variation.selected ? 'ring-2 ring-primary' : ''
            }`}
          >
            <CardContent className="p-0">
              <div
                className="relative w-full aspect-square cursor-pointer"
                onClick={() => onSelect(variation.index)}
              >
                <Image
                  src={variation.url}
                  alt={`Variation ${variation.index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
                {variation.selected && (
                  <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 left-2 h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(variation.index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 3. Main Orchestrator Component (~1 hour)

**File**: `ImageGenerationField.tsx` (~100 lines)
```tsx
'use client';

import { ImageSourceSelector } from './ImageSourceSelector';
import { StyleSelector } from './StyleSelector';
import { GenerationControls } from './GenerationControls';
import { VariationsGallery } from './VariationsGallery';
import { GalleryBrowser } from './GalleryBrowser';
import { useImageGeneration } from './hooks/useImageGeneration';
import { useGallery } from './hooks/useGallery';
import type { ImageFieldProps } from './types';

export function ImageGenerationField(props: ImageFieldProps) {
  const {
    imageSource,
    setImageSource,
    selectedStyle,
    setSelectedStyle,
    isGenerating,
    generatedVariations,
    handleGenerate,
    handleSelectVariation,
    handleDeleteVariation
  } = useImageGeneration(props);

  const {
    showGallery,
    galleryImages,
    isLoadingGallery,
    handleLoadGallery,
    handleSelectFromGallery
  } = useGallery(props);

  if (!props.podcastId) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <ImageSourceSelector
        value={imageSource}
        onChange={setImageSource}
        telegramChannel={props.telegramChannel}
      />

      <StyleSelector
        value={selectedStyle}
        onChange={setSelectedStyle}
        savedStyle={props.savedImageStyle}
      />

      <GenerationControls
        isGenerating={isGenerating}
        onGenerate={handleGenerate}
        onOpenGallery={handleLoadGallery}
        variationCount={variationCount}
      />

      <VariationsGallery
        variations={generatedVariations}
        onSelect={handleSelectVariation}
        onDelete={handleDeleteVariation}
      />

      {showGallery && (
        <GalleryBrowser
          images={galleryImages}
          onSelect={handleSelectFromGallery}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}
```

---

## ✅ Checklist

- [ ] Extract types first
- [ ] Create custom hooks (state logic)
- [ ] Build small, focused components
- [ ] Compose into main component
- [ ] Test each component separately
- [ ] Verify TypeScript types
- [ ] Check accessibility
- [ ] Test responsive design

---

## 🎯 Benefits

**Before**: 730 lines monolith
**After**: 6-7 files, each < 120 lines

✅ Easy to understand each piece
✅ Reusable components
✅ Easier to test
✅ Better composition
✅ Clear separation of concerns

**Status**: ⬜ לא התחיל
**Docs**: [React Composition](https://medium.com/@orami98/8-revolutionary-react-server-components-patterns-that-will-replace-your-client-side-rendering-in-be24e50236e2)
