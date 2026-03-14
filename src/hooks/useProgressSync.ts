import { useState, useEffect, useCallback, type RefObject } from 'react';
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

    const startSec = parseTime(timeStart);
    const endSec = parseTime(timeEnd);

    // ─── Robust State Sync (Fallback + Events) ──────────────────────────
    useEffect(() => {
        let intervalId: number;

        const syncState = () => {
            const player = playerRef.current;
            if (!player) return;

            // Sync playing state
            if (typeof player.getPlayerState === 'function') {
                const state = player.getPlayerState();
                setIsPlaying(state === YTPlayerState.PLAYING);
            }

            // Sync duration if missing
            if (duration === 0 && typeof player.getDuration === 'function') {
                const d = player.getDuration();
                if (d > 0) setDuration(d);
            }

            // Initial time sync if not playing
            if (!isPlaying && typeof player.getCurrentTime === 'function') {
                setCurrentTime(player.getCurrentTime());
            }
        };

        // Event listener for instant response
        const handleStateChange = (event: any) => {
            const state = event.data;
            setIsPlaying(state === YTPlayerState.PLAYING);
            if (state === YTPlayerState.PLAYING) {
                const player = playerRef.current;
                if (player && typeof player.getCurrentTime === 'function') {
                    setCurrentTime(player.getCurrentTime());
                }
            }
        };

        const player = playerRef.current;
        const p = player as any;
        if (p && typeof p.addEventListener === 'function') {
            p.addEventListener('onStateChange', handleStateChange);
        }

        // Run sync immediately and then on interval
        syncState();
        intervalId = window.setInterval(syncState, 500);

        return () => {
            window.clearInterval(intervalId);
            if (p && typeof p.removeEventListener === 'function') {
                p.removeEventListener('onStateChange', handleStateChange);
            }
        };
    }, [playerRef, duration, isPlaying]);

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
    const segmentEnd = endSec > 0 ? endSec : duration;
    const segmentDuration = Math.max(0, segmentEnd - segmentStart);
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
