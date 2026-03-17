import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useYouTubePlayer } from '../useYouTubePlayer';
import type { YTPlayer } from '@/utils/youtube';

describe('useYouTubePlayer', () => {
    let mockPlayer: YTPlayer;

    beforeEach(() => {
        vi.useFakeTimers();
        mockPlayer = {
            getCurrentTime: vi.fn().mockReturnValue(0),
            getPlayerState: vi.fn().mockReturnValue(-1),
            seekTo: vi.fn(),
            playVideo: vi.fn(),
            unMute: vi.fn(),
            setVolume: vi.fn(),
            destroy: vi.fn(),
        } as unknown as YTPlayer;

        // Mock window.YT.Player constructor
        vi.stubGlobal('YT', {
            Player: vi.fn().mockImplementation((id, config) => {
                const player = {
                    ...mockPlayer,
                    ...config.events
                };
                // Simulate onReady
                setTimeout(() => {
                    if (config.events?.onReady) {
                        config.events.onReady({ target: player });
                    }
                }, 0);
                return player;
            }),
            PlayerState: {
                UNSTARTED: -1,
                ENDED: 0,
                PLAYING: 1,
                PAUSED: 2,
                BUFFERING: 3,
                CUED: 5,
            },
        });
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
            vi.runAllTimers();
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
});
