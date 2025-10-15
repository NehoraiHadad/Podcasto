import { Checkbox } from '@/components/ui/checkbox';

interface SelectAllCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/**
 * Checkbox component for "select all" functionality
 * Properly handles indeterminate state when some but not all items are selected
 */
export function SelectAllCheckbox({
  checked,
  indeterminate,
  onCheckedChange
}: SelectAllCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label="Select all episodes"
      ref={(ref) => {
        if (ref) {
          const checkbox = ref.querySelector('input[type="checkbox"]') as HTMLInputElement;
          if (checkbox) checkbox.indeterminate = indeterminate;
        }
      }}
    />
  );
}
