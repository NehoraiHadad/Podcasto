/**
 * Audio Loading State Component
 * Loading spinner displayed while audio is initializing
 */

'use client';

export function AudioLoadingState() {
  return (
    <div className="flex items-center justify-center h-16">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}
