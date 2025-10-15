import { CardFooter } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface LastRunFooterProps {
  time: Date;
}

export function LastRunFooter({ time }: LastRunFooterProps) {
  return (
    <CardFooter className="text-xs text-muted-foreground">
      <Clock className="mr-1 h-3 w-3" />
      Last run finished: {time.toLocaleString()}
    </CardFooter>
  );
}
