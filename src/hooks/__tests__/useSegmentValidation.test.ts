import { renderHook, act, waitFor } from '@testing-library/react';
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
        document.body.innerHTML = '';
    });

    it('should resolve true when onReady is triggered', async () => {
        let onReadyCb: any = null;
        (window.YT.Player as any).mockImplementation(function (_id: string, config: any) {
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

        await waitFor(() => {
            if (typeof onReadyCb !== 'function') throw new Error('onReadyCb not yet captured');
        }, { timeout: 2000 });

        await act(async () => {
            onReadyCb();
        });

        const isValid = await validationPromise!;
        expect(isValid).toBe(true);
    });

    it('should resolve false when onError is triggered', async () => {
        let onErrorCb: any = null;
        (window.YT.Player as any).mockImplementation(function (_id: string, config: any) {
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

        await waitFor(() => {
            if (typeof onErrorCb !== 'function') throw new Error('onErrorCb not yet captured');
        }, { timeout: 2000 });

        await act(async () => {
            onErrorCb();
        });

        const isValid = await validationPromise!;
        expect(isValid).toBe(false);
    });

    it('should resolve false after timeout', async () => {
        vi.useFakeTimers();
        (window.YT.Player as any).mockImplementation(function () {
            return {
                destroy: vi.fn(),
            };
        });

        const { result } = renderHook(() => useSegmentValidation());

        let validationPromise: Promise<boolean>;
        await act(async () => {
            validationPromise = result.current.validateSegment('slow-id');
        });

        await act(async () => {
            vi.advanceTimersByTime(10000);
        });

        const isValid = await validationPromise!;
        expect(isValid).toBe(false);
    });

    it('should destroy existing player before creating new one', async () => {
        const destroySpy = vi.fn();
        (window.YT.Player as any).mockImplementation(function () {
            return {
                destroy: destroySpy,
            };
        });

        const { result } = renderHook(() => useSegmentValidation());

        // First call
        await act(async () => {
            result.current.validateSegment('id-1');
        });

        await waitFor(() => {
            expect(window.YT.Player).toHaveBeenCalled();
        }, { timeout: 2000 });

        // Second call should destroy first
        await act(async () => {
            result.current.validateSegment('id-2');
        });

        expect(destroySpy).toHaveBeenCalled();
    });
});
