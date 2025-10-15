'use client';

import { useState } from 'react';

export interface UseTableSelectionOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  initialSelectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export interface UseTableSelectionReturn {
  selectedIds: string[];
  handleItemSelect: (itemId: string, checked: boolean) => void;
  handleSelectAll: (checked: boolean) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

/**
 * Custom hook for managing table row selection
 * Supports both individual row selection and "select all" functionality
 * with proper indeterminate state handling
 */
export function useTableSelection<T>({
  items,
  getItemId,
  initialSelectedIds = [],
  onSelectionChange
}: UseTableSelectionOptions<T>): UseTableSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  const handleItemSelect = (itemId: string, checked: boolean) => {
    const newSelectedIds = checked
      ? [...selectedIds, itemId]
      : selectedIds.filter(id => id !== itemId);
    setSelectedIds(newSelectedIds);
    onSelectionChange?.(newSelectedIds);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelectedIds = checked ? items.map(getItemId) : [];
    setSelectedIds(newSelectedIds);
    onSelectionChange?.(newSelectedIds);
  };

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < items.length;

  return {
    selectedIds,
    handleItemSelect,
    handleSelectAll,
    isAllSelected,
    isIndeterminate
  };
}
