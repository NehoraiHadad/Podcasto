'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import Image from 'next/image';

interface GeneratedImagePreviewProps {
  currentImageUrl: string | null | undefined;
  onDelete: () => void;
}

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
