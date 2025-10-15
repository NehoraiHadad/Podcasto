import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
  };
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-gray-500',
  trend
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className={trend.value > 0 ? 'text-green-600' : 'text-red-600'}>
              {trend.value > 0 ? '+' : ''}{trend.value}
            </span>
            {' '}{trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
