import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSegmentValidation } from '../useSegmentValidation';

vi.mock('../../utils/youtube', () => ({
    ensureYouTubeIframeAPIReady: vi.fn(() => Promise.resolve()),
}));

describe('useSegmentValidation', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();

        // Mock window.YT.Player
        vi.stubGlobal('YT', {
            Player: vi.fn(),
        });

        // Add validation-player element
        document.body.innerHTML = '<div id="validation-player"></div>';
    });

    it('should resolve true when onReady is triggered', async () => {
        let onReadyCb: any;
        (window.YT.Player as any).mockImplementation((_id: string, config: any) => {
            onReadyCb = config.events.onReady;
            return {
                destroy: vi.fn(),
            };
        });

        const { result } = renderHook(() => useSegmentValidation());

        const validationPromise = result.current.validateSegment('valid-id');

        // Let it reach the player creation
        await act(async () => {
            await Promise.resolve();
        });

        act(() => {
            onReadyCb();
        });

        const isValid = await validationPromise;
        expect(isValid).toBe(true);
    });

    it('should resolve false when onError is triggered', async () => {
        let onErrorCb: any;
        (window.YT.Player as any).mockImplementation((_id: string, config: any) => {
            onErrorCb = config.events.onError;
            return {
                destroy: vi.fn(),
            };
        });

        const { result } = renderHook(() => useSegmentValidation());

        const validationPromise = result.current.validateSegment('invalid-id');

        // Let it reach the player creation
        await act(async () => {
            await Promise.resolve();
        });

        act(() => {
            onErrorCb();
        });

        const isValid = await validationPromise;
        expect(isValid).toBe(false);
    });

    it('should resolve false after timeout', async () => {
        (window.YT.Player as any).mockImplementation(() => ({
            destroy: vi.fn(),
        }));

        const { result } = renderHook(() => useSegmentValidation());

        const validationPromise = result.current.validateSegment('slow-id');

        // Let it reach the player creation
        await act(async () => {
            await Promise.resolve();
        });

        act(() => {
            vi.advanceTimersByTime(8000);
        });

        const isValid = await validationPromise;
        expect(isValid).toBe(false);
    });

    it('should destroy existing player before creating new one', async () => {
        const destroySpy = vi.fn();
        (window.YT.Player as any).mockImplementation(() => ({
            destroy: destroySpy,
        }));

        const { result } = renderHook(() => useSegmentValidation());

        // First call
        await act(async () => {
            result.current.validateSegment('id-1');
            await Promise.resolve(); // allow ensureYouTubeIframeAPIReady to resolve
            await Promise.resolve(); // allow reaching player creation
        });

        // Second call should destroy first
        await act(async () => {
            result.current.validateSegment('id-2');
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(destroySpy).toHaveBeenCalled();
    });
});
