import { useEffect, useRef, useState } from 'react';
import { ensureYouTubeIframeAPIReady, type YTPlayer, type YTEvent, type YTPlayerOptions } from '../utils/youtube';

export interface YouTubeBaseOptions {
    videoId: string;
    target: string | HTMLElement | null;
    playerVars?: YTPlayerOptions['playerVars'];
    events?: YTPlayerOptions['events'];
    /** Optional ref to sync with the player instance. If not provided, a local one is used. */
    playerRef?: React.RefObject<YTPlayer | null>;
}

/**
 * A low-level hook to manage YouTube Player lifecycle.
 * Handles API loading, player creation, and destruction.
 */
export const useYouTubeBase = ({
    videoId,
    target,
    playerVars,
    events,
    playerRef: externalPlayerRef,
}: YouTubeBaseOptions) => {
    const [player, setPlayer] = useState<YTPlayer | null>(null);
    const localPlayerRef = useRef<YTPlayer | null>(null);

    // Use external ref if provided, otherwise the local one.
    // Important: we want to keep the playerInstRef reference stable.
    const playerInstRef = externalPlayerRef || localPlayerRef;

    // Track latest events to avoid re-creating player when callbacks change
    const eventsRef = useRef(events);
    useEffect(() => {
        eventsRef.current = events;
    }, [events]);

    useEffect(() => {
        let isMounted = true;

        const initPlayer = async () => {
            if (!videoId || !target) return;

            await ensureYouTubeIframeAPIReady();
            if (!isMounted) return;

            // Destroy existing player if any
            if (playerInstRef.current) {
                try {
                    playerInstRef.current.destroy();
                } catch (e) {
                    console.warn('Failed to destroy YouTube player:', e);
                }
                playerInstRef.current = null;
                setPlayer(null);
            }

            // Create new player
            const newPlayer = new window.YT.Player(target as any, {
                videoId,
                playerVars: {
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                    ...playerVars,
                },
                events: {
                    ...eventsRef.current,
                    onReady: (event: YTEvent) => {
                        if (!isMounted) return;
                        eventsRef.current?.onReady?.(event);
                    },
                    onStateChange: (event: YTEvent) => {
                        if (!isMounted) return;
                        eventsRef.current?.onStateChange?.(event);
                    },
                    onPlaybackRateChange: (event: YTEvent) => {
                        if (!isMounted) return;
                        eventsRef.current?.onPlaybackRateChange?.(event);
                    },
                    onError: (event: YTEvent) => {
                        if (!isMounted) return;
                        eventsRef.current?.onError?.(event);
                    },
                },
            });

            playerInstRef.current = newPlayer;
            setPlayer(newPlayer);
        };

        initPlayer();

        return () => {
            isMounted = false;
            if (playerInstRef.current) {
                try {
                    playerInstRef.current.destroy();
                } catch (e) {
                    // Ignore errors during unmount cleanup
                }
                playerInstRef.current = null;
                setPlayer(null);
            }
        };
    }, [videoId, target, JSON.stringify(playerVars)]); // Re-init only if ID, target or key vars change

    return {
        player,
        playerRef: playerInstRef
    };
};

