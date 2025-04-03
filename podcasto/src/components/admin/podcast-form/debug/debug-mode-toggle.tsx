'use client';

import { Button } from '@/components/ui/button';

interface DebugModeToggleProps {
  debugMode: boolean;
  onToggle: () => void;
}

export function DebugModeToggle({ debugMode, onToggle }: DebugModeToggleProps) {
  return (
    <div className="flex justify-end mb-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onToggle}
      >
        {debugMode ? 'Hide Debug' : 'Show Debug'}
      </Button>
    </div>
  );
} 