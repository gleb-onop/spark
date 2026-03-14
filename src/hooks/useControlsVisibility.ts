import { useState, useEffect, useRef, useCallback, type RefObject } from 'react';

export const useControlsVisibility = (
    containerRef: RefObject<HTMLDivElement | null>,
    isFullscreen: boolean
) => {
    const [showControls, setShowControls] = useState(true);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetTimer = useCallback(() => {
        setShowControls(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    }, []);

    useEffect(() => {
        // Reset timer on mount and mode change to ensure initial visibility
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        resetTimer();

        const container = containerRef.current;
        if (!container) return;

        // In fullscreen mode, the container itself can still catch events
        const handleMouseMove = () => resetTimer();
        const handleMouseLeave = () => {
            setShowControls(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };

        if (isFullscreen) {
            container.addEventListener('mousemove', handleMouseMove);
            container.addEventListener('mouseleave', handleMouseLeave);
        } else {
            // In normal mode, we rely on the container's mousemove 
            // and the externally-triggered resetTimer from the Scrim
            container.addEventListener('mousemove', handleMouseMove);
            container.addEventListener('mouseleave', handleMouseLeave);
        }

        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isFullscreen, containerRef, resetTimer]);

    return { showControls, resetTimer };
};
