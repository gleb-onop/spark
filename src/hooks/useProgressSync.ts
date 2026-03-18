import { useState, useEffect, useCallback, useMemo, useRef, type RefObject } from 'react';
import { parseTime } from '../utils/time';
import { type YTPlayer, YTPlayerState } from '../utils/youtube';

interface UseProgressSyncProps {
    playerRef: RefObject<YTPlayer | null>;
    timeStart: string | null;
    timeEnd: string | null;
}

export interface PlayerControlsState {
    isPlaying: boolean;
    currentTime: number;
    progressPct: number;
    seek: (pct: number) => void;
}

export const useProgressSync = ({
    playerRef,
    timeStart,
    timeEnd,
}: UseProgressSyncProps): PlayerControlsState => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Use refs for stable access in effects without triggering re-runs
    const isPlayingRef = useRef(isPlaying);
    const durationRef = useRef(duration);

    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { durationRef.current = duration; }, [duration]);

    const startSec = useMemo(() => parseTime(timeStart), [timeStart]);
    const endSec = useMemo(() => parseTime(timeEnd), [timeEnd]);

    // ─── Event Handlers ──────────────────────────────────────────────────
    const handleStateChange = useCallback((event: any) => {
        const state = event.data;
        const playing = state === YTPlayerState.PLAYING;
        setIsPlaying(playing);

        if (playing) {
            const player = playerRef.current;
            if (player && typeof player.getCurrentTime === 'function') {
                setCurrentTime(player.getCurrentTime());
            }
        }
    }, [playerRef]);

    // ─── Robust State Sync (Fallback) ──────────────────────────────────
    useEffect(() => {
        const syncState = () => {
            const player = playerRef.current;
            if (!player) return;

            // Sync playing state
            if (typeof player.getPlayerState === 'function') {
                const state = player.getPlayerState();
                const playing = state === YTPlayerState.PLAYING;
                if (playing !== isPlayingRef.current) {
                    setIsPlaying(playing);
                }
            }

            // Sync duration if missing
            if (durationRef.current === 0 && typeof player.getDuration === 'function') {
                const d = player.getDuration();
                if (d > 0) setDuration(d);
            }

            // Initial time sync if not playing
            if (!isPlayingRef.current && typeof player.getCurrentTime === 'function') {
                setCurrentTime(player.getCurrentTime());
            }
        };
        const player = playerRef.current;

        if (player && typeof player.addEventListener === 'function') {
            player.addEventListener('onStateChange', handleStateChange);
        }

        // Run sync immediately and then on interval
        syncState();
        const intervalId = window.setInterval(syncState, 500);

        return () => {
            window.clearInterval(intervalId);
            if (player && typeof player.removeEventListener === 'function') {
                player.removeEventListener('onStateChange', handleStateChange);
            }
        };
    }, [playerRef, handleStateChange]); // Stable dependencies

    // ─── High-Frequency Progress Loop (RAF) ─────────────────────────────────
    useEffect(() => {
        if (!isPlaying) return;

        let rafId: number;
        const update = () => {
            const player = playerRef.current;
            if (player && typeof player.getCurrentTime === 'function') {
                setCurrentTime(player.getCurrentTime());
            }
            rafId = requestAnimationFrame(update);
        };

        rafId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(rafId);
    }, [isPlaying, playerRef]);

    // ─── Derived values relative to segment ─────────────────────────────────
    const segmentStart = startSec;
    const segmentEnd = useMemo(() => endSec > 0 ? endSec : duration, [endSec, duration]);
    const segmentDuration = useMemo(() => Math.max(0, segmentEnd - segmentStart), [segmentEnd, segmentStart]);
    const segmentCurrentTime = Math.max(0, currentTime - segmentStart);
    const progressPct = segmentDuration > 0
        ? Math.min(100, (segmentCurrentTime / segmentDuration) * 100)
        : 0;

    const seek = useCallback((pct: number) => {
        const player = playerRef.current;
        if (!player) return;
        const targetTime = segmentStart + (pct / 100) * segmentDuration;
        player.seekTo(targetTime, true);
        setCurrentTime(targetTime);
    }, [segmentStart, segmentDuration, playerRef]);

    return {
        isPlaying,
        currentTime,
        progressPct,
        seek,
    };
};
