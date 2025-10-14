'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import Image from 'next/image';
import type { GeneratedVariation } from './types';

interface VariationGalleryProps {
  variations: GeneratedVariation[];
  onSelectVariation: (index: number) => void;
  onDeleteVariation: (index: number) => void;
}

export function VariationGallery({
  variations,
  onSelectVariation,
  onDeleteVariation
}: VariationGalleryProps) {
  if (variations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Label>Generated Variations - Select One</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {variations.map((variation) => (
          <Card
            key={variation.index}
            className={`transition-all ${
              variation.selected ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-muted'
            }`}
          >
            <CardContent className="p-0">
              <div
                className="relative w-full aspect-square rounded-lg overflow-hidden cursor-pointer"
                onClick={() => onSelectVariation(variation.index)}
              >
                <Image
                  src={variation.url}
                  alt={`Variation ${variation.index + 1}`}
                  fill
                  className="object-cover"
                />
                {variation.selected && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 left-2 h-7 w-7 opacity-0 hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteVariation(variation.index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-3 text-center text-sm">
                Variation {variation.index + 1}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
