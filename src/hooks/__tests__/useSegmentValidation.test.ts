import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSegmentValidation } from '../useSegmentValidation';

// Mock the whole module to control ensureYouTubeIframeAPIReady
vi.mock('../../utils/youtube', async (importOriginal) => {
    const original = await importOriginal<any>();
    return {
        ...original,
        ensureYouTubeIframeAPIReady: vi.fn(() => Promise.resolve()),
    };
});

describe('useSegmentValidation', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();

        // Ensure a predictable YT mock
        (window as any).YT = {
            Player: vi.fn(),
        };

        // Add validation-player element
        document.body.innerHTML = '<div id="validation-player"></div>';
    });

    afterEach(() => {
        vi.useRealTimers();
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

        let validationPromise: Promise<boolean>;
        await act(async () => {
            validationPromise = result.current.validateSegment('valid-id');
        });

        // Run all microtasks to reach the point after ensureYouTubeIframeAPIReady
        await act(async () => {
            await vi.runAllTicks();
        });

        await act(async () => {
            onReadyCb();
        });

        const isValid = await validationPromise!;
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

        let validationPromise: Promise<boolean>;
        await act(async () => {
            validationPromise = result.current.validateSegment('invalid-id');
        });

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        await act(async () => {
            onErrorCb();
        });

        const isValid = await validationPromise!;
        expect(isValid).toBe(false);
    });

    it('should resolve false after timeout', async () => {
        (window.YT.Player as any).mockImplementation(() => ({
            destroy: vi.fn(),
        }));

        const { result } = renderHook(() => useSegmentValidation());

        let validationPromise: Promise<boolean>;
        await act(async () => {
            validationPromise = result.current.validateSegment('slow-id');
        });

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        await act(async () => {
            vi.advanceTimersByTime(8001);
        });

        const isValid = await validationPromise!;
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
        });

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        // Second call should destroy first
        await act(async () => {
            result.current.validateSegment('id-2');
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(destroySpy).toHaveBeenCalled();
    });
});
