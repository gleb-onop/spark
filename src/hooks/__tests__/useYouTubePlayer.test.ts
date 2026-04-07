import { renderHook, act } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useYouTubePlayer } from '../useYouTubePlayer';
import { type YTPlayer, YTPlayerState } from '@/lib/youtube';

// Declared at module level because vi.mock factory captures these via closure
let mockPlayer: any;
let lastEvents: any;

vi.mock('../useYouTubeBase', () => ({
    useYouTubeBase: vi.fn().mockImplementation(({ playerRef, events }) => {
        lastEvents = events;
        useEffect(() => {
            if (playerRef) {
                playerRef.current = mockPlayer;
                events?.onReady?.({ target: mockPlayer });
            }
        }, []); // Fix: remove events from deps to avoid infinite loops
        return { player: mockPlayer, playerRef };
    }),
}));

describe('useYouTubePlayer', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    beforeEach(() => {
        vi.useFakeTimers();
        lastEvents = null;
        mockPlayer = {
            getCurrentTime: vi.fn().mockReturnValue(0),
            getPlayerState: vi.fn().mockReturnValue(-1),
            seekTo: vi.fn(),
            playVideo: vi.fn(),
            unMute: vi.fn(),
            setVolume: vi.fn(),
            destroy: vi.fn(),
        } as unknown as YTPlayer;
    });

    it('should initialize player and seek to start time', async () => {
        renderHook(() => useYouTubePlayer({
            youtubeId: 'ABC',
            timeStart: '0:30',
            timeEnd: '1:00',
            onComplete: vi.fn(),
            onSegmentEnded: vi.fn(),
        }));

        await act(async () => {
            vi.runAllTimers();
        });

        // 0:30 is 30s
        expect(mockPlayer.seekTo).toHaveBeenCalledWith(30, true);
        expect(mockPlayer.playVideo).toHaveBeenCalled();
    });

    it('should trigger onSegmentEnded when reaching end time', async () => {
        const onSegmentEnded = vi.fn();
        renderHook(() => useYouTubePlayer({
            youtubeId: 'ABC',
            timeStart: '0:00',
            timeEnd: '0:10',
            onComplete: vi.fn(),
            onSegmentEnded,
        }));

        // Simulate player playing
        await act(async () => {
            lastEvents?.onStateChange?.({ target: mockPlayer, data: YTPlayerState.PLAYING });
            vi.runOnlyPendingTimers();
        });

        // Current time: 9.9s (within 0.15s buffer of 10s)
        (mockPlayer.getCurrentTime as any).mockReturnValue(9.9);

        act(() => {
            vi.advanceTimersByTime(100); // Trigger polling interval
        });

        expect(onSegmentEnded).toHaveBeenCalled();
    });

    it('should seek to specific percentage if initialSeekPct is provided', async () => {
        renderHook(() => useYouTubePlayer({
            youtubeId: 'ABC',
            timeStart: '0:00',
            timeEnd: '1:40', // 100s duration
            initialSeekPct: 50,
            onComplete: vi.fn(),
            onSegmentEnded: vi.fn(),
        }));

        await act(async () => {
            vi.runAllTimers();
        });

        // 50% of 100s is 50s
        expect(mockPlayer.seekTo).toHaveBeenCalledWith(50, true);
    });

    it('should re-seek when segment changes', async () => {
        const { rerender } = renderHook(({ timeStart, timeEnd }) => useYouTubePlayer({
            youtubeId: 'ABC',
            timeStart,
            timeEnd,
            onComplete: vi.fn(),
            onSegmentEnded: vi.fn(),
        }), {
            initialProps: { timeStart: '0:00', timeEnd: '1:00' }
        });

        await act(async () => {
            vi.runAllTimers();
        });

        expect(mockPlayer.seekTo).toHaveBeenLastCalledWith(0, true);

        // Change segment
        rerender({ timeStart: '1:00', timeEnd: '2:00' });

        expect(mockPlayer.seekTo).toHaveBeenLastCalledWith(60, true);
    });

    it('should re-seek to start when forceRestart changes even if segment is the same', async () => {
        const { rerender } = renderHook(({ forceRestart }) => useYouTubePlayer({
            youtubeId: 'ABC',
            timeStart: '0:30',
            timeEnd: '1:00',
            onComplete: vi.fn(),
            onSegmentEnded: vi.fn(),
            forceRestart
        }), {
            initialProps: { forceRestart: 0 }
        });

        await act(async () => {
            vi.runAllTimers();
        });

        // Initial seek (due to isNewSegment)
        expect(mockPlayer.seekTo).toHaveBeenCalledWith(30, true);
        const callsAfterInitial = (mockPlayer.seekTo as any).mock.calls.length;

        // Simulate force restart (e.g. from navigation state) - increment counter
        await act(async () => {
            rerender({ forceRestart: 1 });
            vi.runAllTimers();
        });

        expect(mockPlayer.seekTo).toHaveBeenCalledTimes(callsAfterInitial + 1);
        expect(mockPlayer.seekTo).toHaveBeenLastCalledWith(30, true);
    });
});
