import { ImageIcon } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center">
      <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
      <p className="text-sm text-gray-500">
        Save the podcast first to enable AI image generation
      </p>
    </div>
  );
}
