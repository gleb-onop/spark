import { useEffect, useRef, useCallback } from 'react';
import { parseTime } from '../utils/time';
import { type YTPlayer, type YTEvent, YTPlayerState } from '../utils/youtube';
import { useYouTubeBase } from './useYouTubeBase';

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

    const hasSegment = !!timeEnd;
    const startSec = parseTime(timeStart);
    const endSec = parseTime(timeEnd);

    const startPolling = useCallback(() => {
        stopInterval();
        if (!hasSegment) return;

        intervalRef.current = window.setInterval(() => {
            const player = playerRef.current;
            if (!player || typeof player.getCurrentTime !== 'function') return;

            const currentTime = player.getCurrentTime();
            if (currentTime >= (endSec || 0) - 0.15) {
                stopInterval();
                onSegmentEndedRef.current();
            }
        }, 100);
    }, [hasSegment, startSec, endSec]);

    // 1. Re-sync player when segment changes (without destroying player if video is same)
    useEffect(() => {
        const player = playerRef.current;
        if (player && typeof player.seekTo === 'function') {
            player.seekTo(startSec || 0, true);
            // If already playing, restart polling with new endSec
            if (player.getPlayerState() === YTPlayerState.PLAYING) {
                startPolling();
            }
        }
        return () => stopInterval();
    }, [youtubeId, startSec, endSec, startPolling]);

    useYouTubeBase({
        videoId: youtubeId,
        elementId: 'youtube-player',
        playerRef,
        playerVars: {
            autoplay: 1,
            controls: exposePlayerRef ? 0 : 1,
            disablekb: exposePlayerRef ? 1 : 0,
            fs: exposePlayerRef ? 0 : 1,
            mute: 1,
        },
        events: {
            onReady: (event: YTEvent) => {
                if (sessionStorage.getItem('spark_muted') === '0') {
                    event.target.unMute();
                }
                const savedVol = sessionStorage.getItem('spark_volume');
                if (savedVol !== null) {
                    event.target.setVolume(Number(savedVol));
                }
                event.target.seekTo(startSec || 0, true);
                event.target.playVideo();
            },
            onStateChange: (event: YTEvent) => {
                if (event.data === YTPlayerState.ENDED) {
                    onCompleteRef.current();
                }

                if (event.data === YTPlayerState.PLAYING) {
                    startPolling();
                } else if (event.data === YTPlayerState.PAUSED || event.data === YTPlayerState.BUFFERING) {
                    // We don't necessarily stop polling on buffering, 
                    // but on pause we can to save resources.
                    // Actually, let's just keep it simple.
                } else {
                    stopInterval();
                }
            }
        }
    });

    useEffect(() => {
        return () => {
            stopInterval();
        };
    }, []);

    return {
        playerRef
    };
};
