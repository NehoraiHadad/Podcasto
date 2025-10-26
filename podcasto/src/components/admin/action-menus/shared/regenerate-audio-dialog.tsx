'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { RegenerateMode } from '@/lib/actions/episode/audio-actions';

interface RegenerateAudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mode: RegenerateMode) => Promise<void>;
  episodeTitle: string;
}

export function RegenerateAudioDialog({
  open,
  onOpenChange,
  onConfirm,
  episodeTitle,
}: RegenerateAudioDialogProps) {
  const [selectedMode, setSelectedMode] = useState<RegenerateMode>('audio-only');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsRegenerating(true);
      await onConfirm(selectedMode);
      onOpenChange(false);
      setSelectedMode('audio-only'); // Reset to default
    } catch (error) {
      console.error('Error regenerating audio:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const modes: Array<{
    value: RegenerateMode;
    label: string;
    description: string;
    deletedFiles: string[];
    triggeredLambda: string;
  }> = [
    {
      value: 'audio-only',
      label: 'Audio Only (Fastest)',
      description: 'Regenerate only the audio file using existing script and data',
      deletedFiles: ['Audio files (.mp3, .wav)'],
      triggeredLambda: 'Audio Generation Lambda',
    },
    {
      value: 'script+audio',
      label: 'Script + Audio',
      description: 'Regenerate script and audio using existing Telegram data',
      deletedFiles: ['Script files', 'Audio files (.mp3, .wav)'],
      triggeredLambda: 'Script Preprocessor Lambda → Audio Generation Lambda',
    },
    {
      value: 'full',
      label: 'Full Regeneration (Slowest)',
      description: 'Complete regeneration from scratch - fetch new Telegram data and regenerate everything',
      deletedFiles: ['All S3 files (Telegram data, scripts, audio, images)'],
      triggeredLambda: 'Telegram Fetcher Lambda → Script Preprocessor Lambda → Audio Generation Lambda',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Regenerate Episode Audio
          </DialogTitle>
          <DialogDescription>
            Choose how you want to regenerate the audio for &quot;{episodeTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedMode} onValueChange={(value) => setSelectedMode(value as RegenerateMode)}>
            {modes.map((mode) => (
              <div
                key={mode.value}
                className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 transition-colors"
              >
                <RadioGroupItem value={mode.value} id={mode.value} className="mt-1" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor={mode.value} className="font-semibold cursor-pointer">
                    {mode.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{mode.description}</p>

                  <div className="text-xs space-y-1 pt-2">
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-destructive min-w-[100px]">Will Delete:</span>
                      <div className="flex-1">
                        {mode.deletedFiles.map((file, idx) => (
                          <div key={idx} className="text-muted-foreground">• {file}</div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-primary min-w-[100px]">Will Trigger:</span>
                      <span className="flex-1 text-muted-foreground">{mode.triggeredLambda}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>

          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm">
            <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
              Note:
            </p>
            <p className="text-yellow-800 dark:text-yellow-200">
              The episode will be reset to &quot;pending&quot; status and processed through the selected pipeline.
              Processing may take several minutes depending on the mode selected.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRegenerating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isRegenerating}
            className="gap-2"
          >
            {isRegenerating && <RefreshCw className="h-4 w-4 animate-spin" />}
            {isRegenerating ? 'Starting Regeneration...' : 'Start Regeneration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
