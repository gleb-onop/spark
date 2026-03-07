import { useCallback, useRef, useEffect } from 'react';
import { ensureYouTubeIframeAPIReady } from '../utils/youtube';

export const useSegmentValidation = () => {
    const validationPlayerRef = useRef<any>(null);

    const validateSegment = useCallback((videoId: string): Promise<boolean> => {
        return new Promise(async (resolve) => {
            let resolved = false;

            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    if (validationPlayerRef.current) {
                        try {
                            validationPlayerRef.current.destroy();
                        } catch (e) { }
                        validationPlayerRef.current = null;
                    }
                    console.warn('Validation timed out for video:', videoId);
                    resolve(false);
                }
            }, 8000);

            try {
                await ensureYouTubeIframeAPIReady();

                if (resolved) return;

                if (validationPlayerRef.current) {
                    validationPlayerRef.current.destroy();
                    validationPlayerRef.current = null;
                }

                if (!window.YT || !window.YT.Player) {
                    clearTimeout(timeout);
                    resolved = true;
                    resolve(true);
                    return;
                }

                validationPlayerRef.current = new window.YT.Player('validation-player', {
                    width: 1,
                    height: 1,
                    videoId: videoId,
                    playerVars: {
                        autoplay: 0,
                        controls: 0,
                        mute: 1,
                    },
                    events: {
                        onReady: () => {
                            if (!resolved) {
                                clearTimeout(timeout);
                                resolved = true;
                                if (validationPlayerRef.current) {
                                    validationPlayerRef.current.destroy();
                                    validationPlayerRef.current = null;
                                }
                                resolve(true);
                            }
                        },
                        onError: () => {
                            if (!resolved) {
                                clearTimeout(timeout);
                                resolved = true;
                                if (validationPlayerRef.current) {
                                    validationPlayerRef.current.destroy();
                                    validationPlayerRef.current = null;
                                }
                                resolve(false);
                            }
                        },
                    },
                });
            } catch (err) {
                if (!resolved) {
                    clearTimeout(timeout);
                    resolved = true;
                    resolve(true); // Fallback to success on error
                }
            }
        });
    }, []);

    useEffect(() => {
        return () => {
            if (validationPlayerRef.current) {
                validationPlayerRef.current.destroy();
            }
        };
    }, []);

    return { validateSegment };
};
