'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface FormatSelectorProps {
  value: 'single-speaker' | 'multi-speaker';
  onChange: (value: 'single-speaker' | 'multi-speaker') => void;
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Podcast Format</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the format that best fits your podcast style
        </p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={(newValue) => onChange(newValue as 'single-speaker' | 'multi-speaker')}
        className="grid gap-4"
      >
        {/* Single-Speaker Option */}
        <div className="relative">
          <RadioGroupItem
            value="single-speaker"
            id="single-speaker"
            className="peer sr-only"
          />
          <Label
            htmlFor="single-speaker"
            className="flex flex-col cursor-pointer rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground">
                {value === 'single-speaker' && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-1">Single-Speaker (Monologue)</div>
                <div className="text-sm text-muted-foreground">
                  One host guides the entire episode (monologue format) - best for news summaries, commentary, or educational content
                </div>
              </div>
            </div>
          </Label>
        </div>

        {/* Multi-Speaker Option */}
        <div className="relative">
          <RadioGroupItem
            value="multi-speaker"
            id="multi-speaker"
            className="peer sr-only"
          />
          <Label
            htmlFor="multi-speaker"
            className="flex flex-col cursor-pointer rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground">
                {value === 'multi-speaker' && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-1">Multi-Speaker (Dialogue)</div>
                <div className="text-sm text-muted-foreground">
                  Two speakers engage in conversation (dialogue format) - best for interviews, discussions, or co-hosted shows
                </div>
              </div>
            </div>
          </Label>
        </div>
      </RadioGroup>

      {/* Important Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Choose carefully - the podcast format cannot be changed after creating episodes.
        </AlertDescription>
      </Alert>
    </div>
  );
}
