import { Badge } from '@/components/ui/badge';

interface CostBreakdownBadgeProps {
  label: string;
  value: string | number;
  variant?: 'ai' | 'aws' | 'storage' | 'email' | 'total';
}

export function CostBreakdownBadge({
  label,
  value,
  variant = 'total',
}: CostBreakdownBadgeProps) {
  const variantStyles = {
    ai: 'bg-purple-100 text-purple-800 border-purple-200',
    aws: 'bg-orange-100 text-orange-800 border-orange-200',
    storage: 'bg-blue-100 text-blue-800 border-blue-200',
    email: 'bg-green-100 text-green-800 border-green-200',
    total: 'bg-gray-100 text-gray-800 border-gray-200 font-semibold',
  };

  const formattedValue =
    typeof value === 'number' ? `$${value.toFixed(4)}` : value;

  return (
    <Badge variant="outline" className={variantStyles[variant]}>
      {label}: {formattedValue}
    </Badge>
  );
}
