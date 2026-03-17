import { useEffect, useRef } from 'react';

/**
 * Returns the previous value of a state or prop.
 */
export function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T>(value);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}
