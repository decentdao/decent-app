import { useEffect, useState } from 'react';

export function useDebounce<T>(
  value: T,
  delay?: number,
  setDebouncedValueFunc?: (v: T) => void,
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
      setDebouncedValueFunc?.(value);
    }, delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay, setDebouncedValueFunc]);

  return debouncedValue;
}
