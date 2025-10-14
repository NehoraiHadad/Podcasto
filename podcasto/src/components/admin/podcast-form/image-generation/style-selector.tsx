'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PODCAST_IMAGE_STYLES, VARIATION_OPTIONS } from '@/lib/constants/podcast-image-styles';

interface StyleSelectorProps {
  selectedStyle: string;
  savedImageStyle?: string | null;
  variationCount: number;
  onStyleChange: (style: string) => void;
  onVariationCountChange: (count: number) => void;
}

export function StyleSelector({
  selectedStyle,
  savedImageStyle,
  variationCount,
  onStyleChange,
  onVariationCountChange
}: StyleSelectorProps) {
  const selectedStyleData = PODCAST_IMAGE_STYLES.find(s => s.id === selectedStyle);

  return (
    <div className="space-y-6">
      {/* Style Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="style-select">Image Style</Label>
          {savedImageStyle && selectedStyle === savedImageStyle && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              ✓ Saved style
            </span>
          )}
        </div>
        <Select value={selectedStyle} onValueChange={onStyleChange}>
          <SelectTrigger id="style-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PODCAST_IMAGE_STYLES.map((style) => (
              <SelectItem key={style.id} value={style.id}>
                {style.label}
                {savedImageStyle === style.id && ' ✓'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedStyleData && (
          <p className="text-sm text-muted-foreground">
            {selectedStyleData.description}
          </p>
        )}
      </div>

      {/* Variation Count Selection */}
      <div className="space-y-3">
        <Label>Number of Variations (A/B Testing)</Label>
        <RadioGroup
          value={String(variationCount)}
          onValueChange={(value) => onVariationCountChange(Number(value))}
        >
          {VARIATION_OPTIONS.map((option) => (
            <div key={option.count} className="flex items-center space-x-2">
              <RadioGroupItem value={String(option.count)} id={`variation-${option.count}`} />
              <Label htmlFor={`variation-${option.count}`} className="font-normal cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <p className="text-xs text-muted-foreground">
          Generate multiple variations to choose the best one for your podcast
        </p>
      </div>
    </div>
  );
}
