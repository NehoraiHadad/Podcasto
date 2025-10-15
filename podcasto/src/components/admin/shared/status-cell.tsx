import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';
import { getErrorMessage } from '@/lib/utils/table-utils';

interface StatusCellProps {
  status: string | null;
  metadata?: string | null;
}

/**
 * Renders an episode status with appropriate badge styling
 * For failed statuses, displays an error tooltip when metadata contains error info
 */
export function StatusCell({ status, metadata }: StatusCellProps) {
  if (!status) return <Badge variant="outline">Unknown</Badge>;

  // Handle failed status with error tooltip
  if (status.toLowerCase() === 'failed') {
    const errorMsg = getErrorMessage(metadata || null);
    return (
      <div className="flex items-center gap-1">
        <Badge variant="destructive">Failed</Badge>
        {errorMsg && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="ml-1 cursor-pointer text-red-500">
                <AlertCircle size={16} />
              </span>
            </TooltipTrigger>
            <TooltipContent sideOffset={4}>
              <span className="max-w-xs break-words whitespace-pre-line">{errorMsg}</span>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  // Handle other statuses with appropriate badge variants
  switch (status.toLowerCase()) {
    case 'published':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Published</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
    case 'processing':
      return <Badge variant="secondary">Processing</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
