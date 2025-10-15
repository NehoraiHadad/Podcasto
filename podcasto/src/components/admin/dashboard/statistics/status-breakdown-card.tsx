import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Loader,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface StatusBreakdown {
  pending: number;
  processing: number;
  published: number;
  failed: number;
}

interface StatusBreakdownCardProps {
  statusBreakdown: StatusBreakdown;
}

export function StatusBreakdownCard({ statusBreakdown }: StatusBreakdownCardProps) {
  const statuses = [
    {
      label: 'Published',
      count: statusBreakdown.published,
      variant: 'default' as const,
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    {
      label: 'Processing',
      count: statusBreakdown.processing,
      variant: 'secondary' as const,
      icon: Loader,
      iconColor: 'text-blue-600'
    },
    {
      label: 'Pending',
      count: statusBreakdown.pending,
      variant: 'outline' as const,
      icon: Clock,
      iconColor: 'text-yellow-600'
    },
    {
      label: 'Failed',
      count: statusBreakdown.failed,
      variant: 'destructive' as const,
      icon: XCircle,
      iconColor: 'text-red-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Episode Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statuses.map((status) => {
            const IconComponent = status.icon;
            return (
              <div key={status.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconComponent className={`h-4 w-4 ${status.iconColor}`} />
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <span className="text-xl font-bold">{status.count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
