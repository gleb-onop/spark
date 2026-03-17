import { useRef, useCallback, useEffect } from 'react';

/**
 * Returns a stable reference to a callback that always calls the latest provided version.
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T | undefined): T {
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    });

    return useCallback(((...args: Parameters<T>) => {
        return callbackRef.current?.(...args);
    }) as T, []);
}
