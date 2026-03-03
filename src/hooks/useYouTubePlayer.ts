import { useEffect, useRef } from 'react';

interface UseYouTubePlayerProps {
    youtubeId: string;
    timeStart: string | null;
    timeEnd: string | null;
    onVideoEnded: () => void;
    onFragmentEnded: () => void;
}

export const useYouTubePlayer = ({
    youtubeId,
    timeStart,
    timeEnd,
    onVideoEnded,
    onFragmentEnded,
}: UseYouTubePlayerProps) => {
    const playerRef = useRef<any>(null);
    const intervalRef = useRef<number | null>(null);

    const parseTime = (str: string | null) => {
        if (!str) return 0;
        const [m, s] = str.split(':').map(Number);
        return m * 60 + s;
    };

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

        const loadVideo = () => {
            if (playerRef.current) {
                playerRef.current.destroy();
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
                        if (sessionStorage.getItem('spark_muted') === '0') {
                            event.target.unMute();
                        }
                        event.target.playVideo();
                    },
                    onStateChange: (event: any) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            onVideoEnded();
                        }

                        if (hasFragment) {
                            if (event.data === window.YT.PlayerState.PLAYING) {
                                stopInterval();
                                intervalRef.current = window.setInterval(() => {
                                    const currentTime = event.target.getCurrentTime();
                                    if (currentTime >= endSec - 0.15) {
                                        onFragmentEnded();
                                    }
                                }, 100);
                            } else {
                                stopInterval();
                            }
                        }
                    }
                }
            });
        };

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = loadVideo;
        } else {
            loadVideo();
        }

        return () => {
            stopInterval();
            if (playerRef.current) playerRef.current.destroy();
        };
    }, [youtubeId, timeStart, timeEnd, onVideoEnded, onFragmentEnded]);

    return {
        player: playerRef.current,
        isMuted: () => playerRef.current?.isMuted?.() || false,
    };
};
