import { useEffect, useRef } from 'react';
import { parseTime } from '../utils/time';
import { ensureYouTubeIframeAPIReady } from '../utils/youtube';

interface UseYouTubePlayerProps {
    youtubeId: string;
    timeStart: string | null;
    timeEnd: string | null;
    onComplete: () => void;
    onFragmentEnded: () => void;
}

export const useYouTubePlayer = ({
    youtubeId,
    timeStart,
    timeEnd,
    onComplete,
    onFragmentEnded,
}: UseYouTubePlayerProps) => {
    const playerRef = useRef<any>(null);
    const intervalRef = useRef<number | null>(null);

    // Use refs for callbacks to avoid re-initializing the player when callbacks change
    const onCompleteRef = useRef(onComplete);
    const onFragmentEndedRef = useRef(onFragmentEnded);

    useEffect(() => {
        onCompleteRef.current = onComplete;
        onFragmentEndedRef.current = onFragmentEnded;
    }, [onComplete, onFragmentEnded]);

    const stopInterval = () => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        const startSec = parseTime(timeStart);
        const endSec = parseTime(timeEnd);
        const hasFragment = !!timeEnd;
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
                    controls: 1,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                    mute: 1,
                    start: startSec || 0,
                },
                events: {
                    onReady: (event: any) => {
                        if (!isMounted) return;
                        if (sessionStorage.getItem('spark_muted') === '0') {
                            event.target.unMute();
                        }
                        event.target.playVideo();
                    },
                    onStateChange: (event: any) => {
                        if (!isMounted) return;
                        if (event.data === window.YT.PlayerState.ENDED) {
                            onCompleteRef.current();
                        }

                        if (hasFragment) {
                            stopInterval();
                            if (event.data === window.YT.PlayerState.PLAYING) {
                                intervalRef.current = window.setInterval(() => {
                                    const currentTime = event.target.getCurrentTime();
                                    if (currentTime >= endSec - 0.15) {
                                        onFragmentEndedRef.current();
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
    }, [youtubeId, timeStart, timeEnd]);

    return {
        player: playerRef.current,
        isMuted: () => playerRef.current?.isMuted?.() || false,
    };
};
