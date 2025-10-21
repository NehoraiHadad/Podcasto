interface CharacterCounterProps {
  current: number;
  min?: number;
  max?: number;
  recommended?: { min: number; max: number };
  className?: string;
}

/**
 * Character counter component for text inputs
 * Shows current count and provides visual feedback based on thresholds
 */
export function CharacterCounter({
  current,
  min,
  max,
  recommended,
  className = '',
}: CharacterCounterProps) {
  // Determine the color based on current length
  const getColor = () => {
    if (min && current < min) return 'text-red-500';
    if (max && current > max) return 'text-red-500';
    if (recommended) {
      if (current < recommended.min) return 'text-yellow-600';
      if (current > recommended.max) return 'text-yellow-600';
      return 'text-green-600';
    }
    return 'text-muted-foreground';
  };

  const getMessage = () => {
    const parts: string[] = [];

    if (min && current < min) {
      parts.push(`${min - current} more needed`);
    } else if (max && current > max) {
      parts.push(`${current - max} over limit`);
    } else if (recommended && current < recommended.min) {
      parts.push(`${recommended.min - current} more recommended`);
    } else if (recommended && current > recommended.max) {
      parts.push('Consider shortening');
    }

    if (max) {
      parts.push(`${current}/${max}`);
    } else {
      parts.push(`${current} characters`);
    }

    return parts.join(' · ');
  };

  return (
    <div className={`text-xs ${getColor()} ${className}`}>
      {getMessage()}
    </div>
  );
}
