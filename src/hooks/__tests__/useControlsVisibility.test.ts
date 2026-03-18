import { renderHook, act } from '@testing-library/react';
import { useRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useControlsVisibility } from '../useControlsVisibility';

describe('useControlsVisibility', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it('should show controls initially', () => {
        const { result } = renderHook(() => {
            const ref = useRef<HTMLDivElement>(null);
            return useControlsVisibility(ref, false);
        });

        expect(result.current.showControls).toBe(true);
    });

    it('should hide controls after 3 seconds of inactivity', () => {
        const { result } = renderHook(() => {
            const ref = useRef<HTMLDivElement>(null);
            return useControlsVisibility(ref, false);
        });

        expect(result.current.showControls).toBe(true);

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(result.current.showControls).toBe(false);
    });

    it('should reset timer on resetTimer call', () => {
        const { result } = renderHook(() => {
            const ref = useRef<HTMLDivElement>(null);
            return useControlsVisibility(ref, false);
        });

        act(() => {
            vi.advanceTimersByTime(2000);
            result.current.resetTimer();
        });

        expect(result.current.showControls).toBe(true);

        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(result.current.showControls).toBe(true);

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.showControls).toBe(false);
    });

    it('should add event listeners to container', () => {
        const addEventListenerSpy = vi.fn();
        const removeEventListenerSpy = vi.fn();

        const mockContainer = {
            addEventListener: addEventListenerSpy,
            removeEventListener: removeEventListenerSpy,
        } as unknown as HTMLDivElement;

        const { unmount } = renderHook(() => {
            const ref = { current: mockContainer };
            return useControlsVisibility(ref, false);
        });

        expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
        expect(addEventListenerSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function));

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
    });

    it('should clear timer on unmount', () => {
        const { unmount } = renderHook(() => {
            const ref = useRef<HTMLDivElement>(null);
            return useControlsVisibility(ref, false);
        });

        unmount();
        // таймер не должен вызывать setState после анмаунта — нет ошибок в консоли
        act(() => {
            vi.advanceTimersByTime(3000);
        });
        // просто убеждаемся что не бросает ошибку
    });
});
