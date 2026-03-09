import { useState, useEffect, useCallback, type RefObject } from 'react';
import { parseTime, formatTime } from '../utils/time';

interface UsePlayerControlsProps {
    playerRef: RefObject<any>;
    timeStart: string | null;
    timeEnd: string | null;
    containerRef: RefObject<HTMLElement>;
    isVertical?: boolean;
}

export interface PlayerControlsState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    segmentDuration: number;
    segmentCurrentTime: number;
    progressPct: number;
    volume: number;
    isMuted: boolean;
    playbackRate: number;
    isFullscreen: boolean;
    currentTimeStr: string;
    durationStr: string;
    togglePlay: () => void;
    seek: (pct: number) => void;
    setVolume: (vol: number) => void;
    toggleMute: () => void;
    setRate: (rate: number) => void;
    toggleFullscreen: () => void;
}

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const STORAGE_VOLUME_KEY = 'spark_volume';
const DEFAULT_VOLUME = 100;
const PLAYER_POLL_INTERVAL_MS = 250;

const getSavedVolume = (): number => {
    const v = sessionStorage.getItem(STORAGE_VOLUME_KEY);
    return v !== null ? Number(v) : DEFAULT_VOLUME;
};

export const usePlayerControls = ({
    playerRef,
    timeStart,
    timeEnd,
    containerRef,
    isVertical,
}: UsePlayerControlsProps): PlayerControlsState => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState<number>(() => getSavedVolume());
    const [isMuted, setIsMuted] = useState(true);
    const [playbackRate, setPlaybackRateState] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const startSec = parseTime(timeStart);
    const endSec = parseTime(timeEnd);

    // ─── Polling loop ───────────────────────────────────────────────────────
    // Reads all state from the player every 250ms.
    // This is the single source of truth for isPlaying – we never optimistically
    // toggle it from the button; we wait for the player to report back.
    useEffect(() => {
        const interval = window.setInterval(() => {
            const player = playerRef.current;
            if (!player || typeof player.getPlayerState !== 'function') return;

            // Track play state via YT.PlayerState (same enum values as onStateChange)
            const state = player.getPlayerState();
            const playing = state === window.YT?.PlayerState?.PLAYING;
            setIsPlaying(playing);

            // Current position
            if (typeof player.getCurrentTime === 'function') {
                setCurrentTime(player.getCurrentTime());
            }

            // Duration (may not be available immediately after init)
            if (typeof player.getDuration === 'function') {
                const d = player.getDuration();
                if (d > 0) setDuration(d);
            }

            // Volume / mute (sync from player so external changes are reflected)
            if (typeof player.isMuted === 'function') {
                setIsMuted(player.isMuted());
            }
            if (typeof player.getVolume === 'function') {
                const vol = player.getVolume();
                setVolumeState(vol);
            }
            if (typeof player.getPlaybackRate === 'function') {
                setPlaybackRateState(player.getPlaybackRate());
            }
        }, PLAYER_POLL_INTERVAL_MS);

        return () => clearInterval(interval);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally empty – playerRef is stable, polling always reads current

    // ─── Fullscreen sync ────────────────────────────────────────────────────
    useEffect(() => {
        const handleFsChange = () => {
            const isFs = !!document.fullscreenElement;
            setIsFullscreen(isFs);
            if (!isFs) {
                try {
                    if (screen.orientation && (screen.orientation as any).unlock) {
                        (screen.orientation as any).unlock();
                    }
                } catch (e) {
                    console.warn('Screen orientation unlock failed:', e);
                }
            }
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    // ─── Derived values relative to segment ─────────────────────────────────
    const segmentStart = startSec;
    const segmentEnd = endSec > 0 ? endSec : duration;
    const segmentDuration = Math.max(0, segmentEnd - segmentStart);
    const segmentCurrentTime = Math.max(0, currentTime - segmentStart);
    const progressPct = segmentDuration > 0
        ? Math.min(100, (segmentCurrentTime / segmentDuration) * 100)
        : 0;

    // ─── Methods ─────────────────────────────────────────────────────────────

    const togglePlay = useCallback(() => {
        const player = playerRef.current;
        if (!player) return;
        // We intentionally do NOT set isPlaying here –
        // the 250ms polling loop will pick it up from the player state.
        if (isPlaying) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    }, [isPlaying]);

    const seek = useCallback((pct: number) => {
        const player = playerRef.current;
        if (!player) return;
        const targetTime = segmentStart + (pct / 100) * segmentDuration;
        player.seekTo(targetTime, true);
        // Optimistic update for immediate feel (will also be corrected by polling)
        setCurrentTime(targetTime);
    }, [segmentStart, segmentDuration]);

    const setVolume = useCallback((vol: number) => {
        const player = playerRef.current;
        if (!player) return;
        player.setVolume(vol);
        setVolumeState(vol);
        sessionStorage.setItem(STORAGE_VOLUME_KEY, String(vol));
        if (vol > 0 && isMuted) {
            player.unMute();
            sessionStorage.setItem('spark_muted', '0');
        }
    }, [isMuted]);

    const toggleMute = useCallback(() => {
        const player = playerRef.current;
        if (!player) return;
        if (isMuted) {
            player.unMute();
            sessionStorage.setItem('spark_muted', '0');
        } else {
            player.mute();
            sessionStorage.setItem('spark_muted', '1');
        }
        // polling will update isMuted in ≤250ms
    }, [isMuted]);

    const setRate = useCallback((rate: number) => {
        const player = playerRef.current;
        if (!player) return;
        player.setPlaybackRate(rate);
        setPlaybackRateState(rate);
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().then(() => {
                try {
                    if (screen.orientation && (screen.orientation as any).lock) {
                        const lockType = isVertical ? 'portrait' : 'landscape';
                        (screen.orientation as any).lock(lockType).catch((err: any) => {
                            console.warn('Screen orientation lock failed:', err);
                        });
                    }
                } catch (e) {
                    console.warn('Screen orientation API not supported:', e);
                }
            }).catch(err => {
                console.error('Fullscreen request failed:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }, [containerRef, isVertical]);

    return {
        isPlaying,
        currentTime,
        duration,
        segmentDuration,
        segmentCurrentTime,
        progressPct,
        volume,
        isMuted,
        playbackRate,
        isFullscreen,
        currentTimeStr: formatTime(segmentCurrentTime),
        durationStr: formatTime(segmentDuration),
        togglePlay,
        seek,
        setVolume,
        toggleMute,
        setRate,
        toggleFullscreen,
    };
};
