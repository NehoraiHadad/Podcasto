import type { S3FileInfo } from '@/lib/services/s3-service-types';
import { FileListItem } from './file-list-item';

interface FilesListProps {
  files: S3FileInfo[];
  onView: (file: S3FileInfo) => void;
  onDelete: (file: S3FileInfo) => void;
}

export function FilesList({ files, onView, onDelete }: FilesListProps) {
  return (
    <div className="space-y-2">
      {files.map((file) => (
        <FileListItem
          key={file.key}
          file={file}
          onView={onView}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
