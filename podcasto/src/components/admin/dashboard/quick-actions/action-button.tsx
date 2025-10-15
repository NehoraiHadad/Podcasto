import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

export function ActionButton({
  href,
  icon: Icon,
  label,
  description,
  variant = 'outline'
}: ActionButtonProps) {
  return (
    <Link href={href}>
      <Button variant={variant} className="w-full h-auto flex flex-col items-start p-4 gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="font-semibold text-sm">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground font-normal">{description}</span>
      </Button>
    </Link>
  );
}
