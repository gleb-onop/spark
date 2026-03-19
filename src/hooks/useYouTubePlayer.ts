import { useEffect, useRef, useCallback } from 'react';
import { parseTime } from '../utils/time';
import { type YTPlayer, type YTEvent, YTPlayerState } from '@/lib/youtube';
import { useYouTubeBase } from './useYouTubeBase';

interface UseYouTubePlayerProps {
    youtubeId: string;
    timeStart: string | null;
    timeEnd: string | null;
    initialSeekPct?: number | null;
    onComplete: () => void;
    onSegmentEnded: () => void;
    playerElement?: HTMLElement | null;
}

export const useYouTubePlayer = ({
    youtubeId,
    timeStart,
    timeEnd,
    initialSeekPct,
    onComplete,
    onSegmentEnded,
    playerElement,
}: UseYouTubePlayerProps) => {
    const playerRef = useRef<YTPlayer | null>(null);
    const intervalRef = useRef<number | null>(null);
    const onCompleteRef = useRef(onComplete);
    const onSegmentEndedRef = useRef(onSegmentEnded);
    const hasPerformedInitialSeek = useRef(false);
    const lastSegmentKey = useRef<string>('');
    const playerReady = useRef(false);

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
    }, [hasSegment, endSec]);

    // 1. Re-sync player when segment or video changes
    useEffect(() => {
        const player = playerRef.current;
        if (player && playerReady.current && typeof player.seekTo === 'function') {
            const currentSegmentKey = `${youtubeId}-${timeStart}-${timeEnd}`;
            const isNewSegment = currentSegmentKey !== lastSegmentKey.current;

            if (isNewSegment) {
                lastSegmentKey.current = currentSegmentKey;
                hasPerformedInitialSeek.current = false;

                // Priority:
                // 1. Initial percentage jump if provided
                // 2. Default segment start
                const start = startSec || 0;
                let targetSeek = start;

                if (initialSeekPct !== undefined && initialSeekPct !== null) {
                    const duration = (endSec || 0) - start;
                    if (duration > 0) {
                        targetSeek = start + (initialSeekPct / 100) * duration;
                    }
                }

                player.seekTo(targetSeek, true);
                hasPerformedInitialSeek.current = true;
            }

            // If already playing, restart polling with new endSec
            if (player.getPlayerState() === YTPlayerState.PLAYING) {
                startPolling();
            }
        }
        return () => stopInterval();
    }, [youtubeId, startSec, endSec, startPolling, initialSeekPct, timeStart, timeEnd]);

    useYouTubeBase({
        videoId: youtubeId,
        target: playerElement || 'youtube-player',
        playerRef,
        playerVars: {
            autoplay: 1,
            controls: 1,
            disablekb: 0,
            fs: 0,
            mute: 1,
        },
        events: {
            onReady: (event: YTEvent) => {
                playerReady.current = true;
                if (sessionStorage.getItem('spark_muted') === '0') {
                    event.target.unMute();
                }
                const savedVol = sessionStorage.getItem('spark_volume');
                if (savedVol !== null) {
                    event.target.setVolume(Number(savedVol));
                }

                // Initial seek on ready
                const start = startSec || 0;
                let targetSeek = start;

                if (initialSeekPct !== undefined && initialSeekPct !== null) {
                    const duration = (endSec || 0) - start;
                    if (duration > 0) {
                        targetSeek = start + (initialSeekPct / 100) * duration;
                    }
                }

                event.target.seekTo(targetSeek, true);
                hasPerformedInitialSeek.current = true;
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

