import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface FilesCardHeaderProps {
  filesCount: number;
  onRefresh: () => void;
  onDeleteAll: () => void;
  hasFiles: boolean;
}

export function FilesCardHeader({
  filesCount,
  onRefresh,
  onDeleteAll,
  hasFiles
}: FilesCardHeaderProps) {
  return (
    <CardHeader>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Episode Files</CardTitle>
          <CardDescription>
            {filesCount} file(s) in S3 storage
          </CardDescription>
        </div>
        <div className="flex gap-2 sm:flex-shrink-0">
          <Button onClick={onRefresh} variant="outline" size="sm" className="flex-1 sm:flex-initial">
            Refresh
          </Button>
          {hasFiles && (
            <Button
              onClick={onDeleteAll}
              variant="destructive"
              size="sm"
              className="flex-1 sm:flex-initial"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Delete All</span>
              <span className="sm:hidden">Delete</span>
            </Button>
          )}
        </div>
      </div>
    </CardHeader>
  );
}
