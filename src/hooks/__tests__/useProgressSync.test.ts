import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useProgressSync } from '../useProgressSync';
import type { YTPlayer } from '@/utils/youtube';

describe('useProgressSync', () => {
    let mockPlayer: YTPlayer;
    let stateChangeHandler: (event: any) => void;

    afterEach(() => {
        vi.useRealTimers();
    });

    beforeEach(() => {
        vi.useFakeTimers();
        mockPlayer = {
            getCurrentTime: vi.fn().mockReturnValue(0),
            getDuration: vi.fn().mockReturnValue(120),
            getPlayerState: vi.fn().mockReturnValue(1), // PLAYING
            seekTo: vi.fn(),
            addEventListener: vi.fn().mockImplementation((event, handler) => {
                if (event === 'onStateChange') stateChangeHandler = handler;
            }),
            removeEventListener: vi.fn(),
        } as unknown as YTPlayer;
    });

    it('should initialize with 0 progress', () => {
        const { result } = renderHook(() => useProgressSync({
            playerRef: { current: mockPlayer },
            timeStart: '0:00',
            timeEnd: '2:00', // 120s
        }));

        expect(result.current.currentTime).toBe(0);
        expect(result.current.progressPct).toBe(0);
        expect(mockPlayer.addEventListener).toHaveBeenCalledWith('onStateChange', expect.any(Function));
    });

    it('should update progress using requestAnimationFrame when playing', async () => {
        const { result } = renderHook(() => useProgressSync({
            playerRef: { current: mockPlayer },
            timeStart: '0:00',
            timeEnd: '2:00', // Defines the 120s boundary
        }));

        // Initially 0
        expect(result.current.currentTime).toBe(0);

        // Mock time progression
        (mockPlayer.getCurrentTime as any).mockReturnValue(30);

        act(() => {
            vi.advanceTimersByTime(16); // ~1 frame
        });

        // 30 / 120 * 100 = 25%
        expect(result.current.currentTime).toBe(30);
        expect(result.current.progressPct).toBe(25);
    });

    it('should calculate progress relative to segment start/end', () => {
        // Segment: 1:00 to 2:00 (60s duration)
        const { result } = renderHook(() => useProgressSync({
            playerRef: { current: mockPlayer },
            timeStart: '1:00',
            timeEnd: '2:00',
        }));

        // Mock current time at 1:30 (90s)
        (mockPlayer.getCurrentTime as any).mockReturnValue(90);

        act(() => {
            vi.advanceTimersByTime(16);
        });

        // (90 - 60) / (120 - 60) * 100 = 50%
        expect(result.current.currentTime).toBe(90);
        expect(result.current.progressPct).toBe(50);
    });

    it('should seek to target time based on percentage', () => {
        const { result } = renderHook(() => useProgressSync({
            playerRef: { current: mockPlayer },
            timeStart: '1:00',
            timeEnd: '2:00',
        }));

        act(() => {
            result.current.seek(50);
        });

        // 50% of 60s segment starting at 60s is 90s
        expect(mockPlayer.seekTo).toHaveBeenCalledWith(90, true);
        expect(result.current.currentTime).toBe(90);
    });

    it('should sync playing state via event and cleanup listeners', async () => {
        vi.useRealTimers();
        (mockPlayer.getPlayerState as any).mockReturnValue(2); // PAUSED
        const { result, unmount } = renderHook(() => useProgressSync({
            playerRef: { current: mockPlayer },
            timeStart: '0:00',
            timeEnd: '2:00',
        }));

        // Wait for effect to register listener
        await waitFor(() => {
            if (!stateChangeHandler) throw new Error('Listener not yet registered');
        });

        expect(result.current.isPlaying).toBe(false);

        // Simulate state change to PLAYING via event
        act(() => {
            (mockPlayer.getPlayerState as any).mockReturnValue(1); // PLAYING
            stateChangeHandler({ data: 1 }); // 1 = PLAYING
        });

        await waitFor(() => {
            expect(result.current.isPlaying).toBe(true);
        });

        unmount();
        expect(mockPlayer.removeEventListener).toHaveBeenCalledWith('onStateChange', expect.any(Function));
    });
});
