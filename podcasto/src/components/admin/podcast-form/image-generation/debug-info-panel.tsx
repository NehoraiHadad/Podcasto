'use client';

import { Label } from '@/components/ui/label';
import Image from 'next/image';
import type { GenerationDebugInfo } from './types';

interface DebugInfoPanelProps {
  debugInfo: GenerationDebugInfo | null;
}

export function DebugInfoPanel({ debugInfo }: DebugInfoPanelProps) {
  if (!debugInfo) {
    return null;
  }

  return (
    <div className="space-y-6 mt-8 p-6 bg-muted/30 rounded-lg border">
      <h3 className="text-lg font-semibold">Generation Process Details</h3>

      {/* Original Image */}
      {debugInfo.originalImageData && (
        <div className="space-y-2">
          <Label className="text-base font-medium">1. Original Source Image</Label>
          <div className="relative w-full aspect-square max-w-sm rounded-lg overflow-hidden border bg-background">
            <Image
              src={`data:image/jpeg;base64,${debugInfo.originalImageData}`}
              alt="Original source"
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* AI Analysis */}
      <div className="space-y-2">
        <Label className="text-base font-medium">2. AI Analysis of Source Image</Label>
        {debugInfo.analysis ? (
          <div className="space-y-3 text-sm bg-background p-4 rounded-md border">
            <div>
              <span className="font-semibold">Description:</span>
              <p className="mt-1 text-muted-foreground">{debugInfo.analysis.description}</p>
            </div>
            <div>
              <span className="font-semibold">Dominant Colors:</span>
              <p className="mt-1 text-muted-foreground">{debugInfo.analysis.colors}</p>
            </div>
            <div>
              <span className="font-semibold">Visual Style:</span>
              <p className="mt-1 text-muted-foreground">{debugInfo.analysis.style}</p>
            </div>
            <div>
              <span className="font-semibold">Main Elements:</span>
              <p className="mt-1 text-muted-foreground">{debugInfo.analysis.mainElements}</p>
            </div>
            <div>
              <span className="font-semibold">Mood:</span>
              <p className="mt-1 text-muted-foreground">{debugInfo.analysis.mood}</p>
            </div>
          </div>
        ) : (
          <div className="text-sm bg-amber-50 dark:bg-amber-950 p-4 rounded-md border border-amber-200 dark:border-amber-800">
            <p className="text-amber-800 dark:text-amber-200">
              ⚠️ Image analysis failed or was skipped. The AI will use a generic enhancement approach.
              Check the console logs for details.
            </p>
          </div>
        )}
      </div>

      {/* Generation Prompt */}
      {debugInfo.prompt && (
        <div className="space-y-2">
          <Label className="text-base font-medium">3. Prompt Sent to Gemini 2.5 Flash Image (Nano Banana)</Label>
          <pre className="text-xs bg-background p-4 rounded-md border overflow-x-auto whitespace-pre-wrap font-mono">
            {debugInfo.prompt}
          </pre>
        </div>
      )}
    </div>
  );
}
