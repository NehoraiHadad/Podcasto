'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import type { ImageSource } from './types';

interface ImageSourceSelectorProps {
  imageSource: ImageSource;
  telegramChannel?: string | null;
  uploadedFile: File | null;
  manualUrl: string;
  onSourceChange: (source: ImageSource) => void;
  onFileUpload: (file: File | null) => void;
  onUrlChange: (url: string) => void;
}

export function ImageSourceSelector({
  imageSource,
  telegramChannel,
  uploadedFile,
  manualUrl,
  onSourceChange,
  onFileUpload,
  onUrlChange
}: ImageSourceSelectorProps) {
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

  return (
    <div className="space-y-3">
      <Label>Image Source</Label>
      <RadioGroup value={imageSource} onValueChange={(value) => onSourceChange(value as ImageSource)}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="telegram" id="telegram" disabled={!telegramChannel} />
          <Label
            htmlFor="telegram"
            className={`font-normal cursor-pointer ${!telegramChannel ? 'text-muted-foreground' : ''}`}
          >
            Auto from Telegram Channel {telegramChannel ? `(@${telegramChannel})` : '(configure in Content tab)'}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="upload" id="upload" />
          <Label htmlFor="upload" className="font-normal cursor-pointer">
            Upload Image File
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="url" id="url" />
          <Label htmlFor="url" className="font-normal cursor-pointer">
            Manual URL
          </Label>
        </div>
      </RadioGroup>

      {imageSource === 'upload' && (
        <div className="space-y-2 pt-2">
          <Label htmlFor="file-upload">Upload Image</Label>
          <div className="flex items-center gap-2">
            <Input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {uploadedFile && (
              <span className="text-sm text-muted-foreground">
                {uploadedFile.name}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Maximum file size: 5MB. Supported formats: JPG, PNG, WebP
          </p>
        </div>
      )}

      {imageSource === 'url' && (
        <div className="space-y-2 pt-2">
          <Label htmlFor="manual-url">Image URL</Label>
          <Input
            id="manual-url"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={manualUrl}
            onChange={(e) => onUrlChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Enter a publicly accessible image URL
          </p>
        </div>
      )}
    </div>
  );
}
