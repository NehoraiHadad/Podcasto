import { Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TooltipLabelProps {
  htmlFor?: string;
  label: string;
  tooltip: string;
  required?: boolean;
  className?: string;
}

/**
 * A label with an info icon that shows a tooltip on hover
 * Useful for providing additional context for form fields
 */
export function TooltipLabel({
  htmlFor,
  label,
  tooltip,
  required = false,
  className = '',
}: TooltipLabelProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Label htmlFor={htmlFor} className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
