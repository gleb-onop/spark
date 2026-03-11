import { useEffect, useRef } from 'react';
import { parseTime } from '../utils/time';
import { ensureYouTubeIframeAPIReady, type YTPlayer, type YTEvent } from '../utils/youtube';

interface UseYouTubePlayerProps {
    youtubeId: string;
    timeStart: string | null;
    timeEnd: string | null;
    onComplete: () => void;
    onSegmentEnded: () => void;
    /** When true, disables native controls and exposes playerRef for custom controls. */
    exposePlayerRef?: boolean;
}

export const useYouTubePlayer = ({
    youtubeId,
    timeStart,
    timeEnd,
    onComplete,
    onSegmentEnded,
    exposePlayerRef = false,
}: UseYouTubePlayerProps) => {
    const playerRef = useRef<YTPlayer | null>(null);
    const intervalRef = useRef<number | null>(null);

    // Use refs for callbacks to avoid re-initializing the player when callbacks change
    const onCompleteRef = useRef(onComplete);
    const onSegmentEndedRef = useRef(onSegmentEnded);

    useEffect(() => {
        onCompleteRef.current = onComplete;
        onSegmentEndedRef.current = onSegmentEnded;
    }, [onComplete, onSegmentEnded]);

    const stopInterval = () => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        const startSec = parseTime(timeStart);
        const endSec = parseTime(timeEnd);
        const hasSegment = !!timeEnd;
        let isMounted = true;

        const initializePlayer = () => {
            if (!isMounted) return;

            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }

            playerRef.current = new window.YT.Player('youtube-player', {
                videoId: youtubeId,
                playerVars: {
                    autoplay: 1,
                    controls: exposePlayerRef ? 0 : 1,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                    mute: 1,
                    start: startSec || 0,
                },
                events: {
                    onReady: (event: YTEvent) => {
                        if (!isMounted) return;
                        if (sessionStorage.getItem('spark_muted') === '0') {
                            event.target.unMute();
                        }
                        const savedVol = sessionStorage.getItem('spark_volume');
                        if (savedVol !== null) {
                            event.target.setVolume(Number(savedVol));
                        }
                        event.target.playVideo();
                    },
                    onStateChange: (event: YTEvent) => {
                        if (!isMounted) return;
                        if (event.data === window.YT.PlayerState.ENDED) {
                            onCompleteRef.current();
                        }

                        if (hasSegment) {
                            stopInterval();
                            if (event.data === window.YT.PlayerState.PLAYING) {
                                intervalRef.current = window.setInterval(() => {
                                    const currentTime = event.target.getCurrentTime();
                                    if (currentTime >= (endSec || 0) - 0.15) {
                                        onSegmentEndedRef.current();
                                    }
                                }, 100);
                            }
                        }
                    }
                }
            });
        };

        if (window.YT && window.YT.Player) {
            initializePlayer();
        } else {
            ensureYouTubeIframeAPIReady().then(() => {
                if (isMounted) initializePlayer();
            });
        }

        return () => {
            isMounted = false;
            stopInterval();
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [youtubeId, timeStart, timeEnd, exposePlayerRef]);

    return {
        player: playerRef.current,
        playerRef,
        isMuted: () => playerRef.current?.isMuted?.() || false,
    };
};
