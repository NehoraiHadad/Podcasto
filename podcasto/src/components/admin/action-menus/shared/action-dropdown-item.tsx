import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ActionMenuItem } from '../types';

interface ActionDropdownItemProps {
  item: ActionMenuItem;
}

export function ActionDropdownItem({ item }: ActionDropdownItemProps) {
  if (item.show === false) return null;

  return (
    <DropdownMenuItem
      onClick={item.onClick}
      disabled={item.disabled}
      className={item.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''}
    >
      {item.icon && <span className="mr-2">{item.icon}</span>}
      {item.label}
    </DropdownMenuItem>
  );
}
