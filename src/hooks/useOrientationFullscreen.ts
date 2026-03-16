import { useEffect } from 'react';

const isLandscape = (): boolean => {
    if (screen.orientation?.type) {
        return screen.orientation.type.startsWith('landscape');
    }
    // Legacy fallback (iOS Safari, older browsers)
    const orientation = (window as any).orientation as number | undefined;
    return orientation === 90 || orientation === -90;
};

export const useOrientationFullscreen = (
    containerRef: React.RefObject<HTMLDivElement | null>,
    isFullscreen: boolean,
): void => {
    useEffect(() => {
        const fullscreenSupported = typeof document !== 'undefined' && !!document.fullscreenEnabled;
        if (!fullscreenSupported) return;

        const handleOrientationChange = () => {
            if (isLandscape()) {
                // Enter fullscreen on landscape
                if (!document.fullscreenElement) {
                    try {
                        containerRef.current?.requestFullscreen()?.catch(() => { });
                    } catch {
                        // iOS Safari — silently ignore
                    }
                }
            } else {
                // Exit fullscreen on portrait
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => { });
                }
            }
        };

        // Prefer modern API, fallback to legacy event
        if (screen.orientation?.addEventListener) {
            screen.orientation.addEventListener('change', handleOrientationChange);
        }
        window.addEventListener('orientationchange', handleOrientationChange);

        return () => {
            if (screen.orientation?.removeEventListener) {
                screen.orientation.removeEventListener('change', handleOrientationChange);
            }
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, [containerRef, isFullscreen]);
};
