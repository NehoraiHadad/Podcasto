import { FolderOpen } from 'lucide-react';

export function FilesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        No files found for this episode
      </p>
    </div>
  );
}
