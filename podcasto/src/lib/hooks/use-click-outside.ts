import { RefObject, useEffect } from 'react';

/**
 * Custom hook that handles clicks outside a specified element.
 * This is a simplified version of useOnClickOutside from usehooks-ts
 * that properly handles null refs.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: () => void
): void {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler]);
} 