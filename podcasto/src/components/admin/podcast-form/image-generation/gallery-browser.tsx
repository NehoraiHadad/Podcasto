'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import type { GalleryImage } from './types';

interface GalleryBrowserProps {
  isOpen: boolean;
  images: GalleryImage[];
  onClose: () => void;
  onSelectImage: (image: GalleryImage) => void;
  onDeleteImage: (image: GalleryImage) => void;
}

export function GalleryBrowser({
  isOpen,
  images,
  onClose,
  onSelectImage,
  onDeleteImage
}: GalleryBrowserProps) {
  if (!isOpen) {
    return null;
  }

  const handleDeleteClick = (e: React.MouseEvent, image: GalleryImage) => {
    e.stopPropagation();

    if (!confirm(`Delete "${image.key.split('/').pop()}"?`)) {
      return;
    }

    onDeleteImage(image);
  };

  return (
    <div className="space-y-4 p-6 bg-muted/50 rounded-lg border-2 border-primary/30">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-lg font-semibold">Image Gallery</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Select an image from previously generated versions
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          Close
        </Button>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-8">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No images found in gallery</p>
          <p className="text-sm text-muted-foreground mt-1">Generate some images first!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
          {images.map((image) => (
            <Card
              key={image.key}
              className="transition-all hover:ring-2 hover:ring-primary"
            >
              <CardContent className="p-0">
                <div
                  className="relative w-full aspect-square rounded-t-lg overflow-hidden cursor-pointer group"
                  onClick={() => onSelectImage(image)}
                >
                  <Image
                    src={image.url}
                    alt="Gallery image"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteClick(e, image)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-2 space-y-1">
                  <div className="text-xs font-medium text-center capitalize">
                    {image.type}
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    {new Date(image.lastModified).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
