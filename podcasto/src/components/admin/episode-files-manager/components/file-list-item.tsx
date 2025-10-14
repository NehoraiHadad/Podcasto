import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2 } from 'lucide-react';
import type { S3FileInfo } from '@/lib/services/s3-service-types';
import { getFileIcon, getTypeBadgeColor, formatBytes } from '../utils/file-helpers';

interface FileListItemProps {
  file: S3FileInfo;
  onView: (file: S3FileInfo) => void;
  onDelete: (file: S3FileInfo) => void;
}

export function FileListItem({ file, onView, onDelete }: FileListItemProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3 hover:bg-muted/50 gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0">
          {getFileIcon(file.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <Badge className={`${getTypeBadgeColor(file.type)} w-fit`} variant="secondary">
              {file.type}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatBytes(file.size)} •{' '}
            {new Date(file.lastModified).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex gap-2 sm:ml-2 sm:flex-shrink-0">
        <Button
          onClick={() => onView(file)}
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-initial"
        >
          <Eye className="h-4 w-4 sm:mr-0" />
          <span className="ml-2 sm:hidden">View</span>
        </Button>
        <Button
          onClick={() => onDelete(file)}
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive flex-1 sm:flex-initial"
        >
          <Trash2 className="h-4 w-4 sm:mr-0" />
          <span className="ml-2 sm:hidden">Delete</span>
        </Button>
      </div>
    </div>
  );
}
