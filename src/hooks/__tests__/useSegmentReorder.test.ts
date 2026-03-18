import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSegmentReorder } from '../useSegmentReorder';
import { api } from '@/services/api';
import { toast } from 'sonner';

vi.mock('@/services/api', () => ({
    api: {
        reorderSegments: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
    },
}));

const mockSegments = [
    { uuid: '1', description: 'Segment 1' },
    { uuid: '2', description: 'Segment 2' },
    { uuid: '3', description: 'Segment 3' },
] as any;

describe('useSegmentReorder', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize local segments', () => {
        const { result } = renderHook(() => useSegmentReorder(mockSegments, 'video-1'));
        expect(result.current.localSegments).toEqual(mockSegments);
    });

    it('should update local segments optimistically on drag end', () => {
        const { result } = renderHook(() => useSegmentReorder(mockSegments, 'video-1'));

        act(() => {
            result.current.handleDragEnd({
                active: { id: '1' },
                over: { id: '2' },
            } as any);
        });

        // 1 moved after 2
        expect(result.current.localSegments[0].uuid).toBe('2');
        expect(result.current.localSegments[1].uuid).toBe('1');
    });

    it('should call api.reorderSegments after debounce', async () => {
        const { result } = renderHook(() => useSegmentReorder(mockSegments, 'video-1'));

        act(() => {
            result.current.handleDragEnd({
                active: { id: '1' },
                over: { id: '2' },
            } as any);
        });

        expect(api.reorderSegments).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(api.reorderSegments).toHaveBeenCalledWith('video-1', ['2', '1', '3']);
    });

    it('should rollback and show error toast on api failure', async () => {
        vi.useRealTimers();
        (api.reorderSegments as any).mockRejectedValue(new Error('API Error'));
        const { result } = renderHook(() => useSegmentReorder(mockSegments, 'video-1'));

        act(() => {
            // Need to call handleDragStart to populate previousSegmentsRef
            result.current.handleDragStart({ active: { id: '1' } } as any);

            result.current.handleDragEnd({
                active: { id: '1' },
                over: { id: '2' },
            } as any);
        });

        // Optimistic update happened
        expect(result.current.localSegments[0].uuid).toBe('2');

        // Rolled back - use waitFor to be sure (debounce is 1000ms)
        await waitFor(() => {
            expect(result.current.localSegments[0].uuid).toBe('1');
        }, { timeout: 3000 });
        expect(toast.error).toHaveBeenCalledWith('Не удалось сохранить новый порядок сегментов');
    });

    it('should update local segments when props change', () => {
        const { result, rerender } = renderHook(({ segments }) => useSegmentReorder(segments, 'video-1'), {
            initialProps: { segments: mockSegments }
        });

        const newSegments = [...mockSegments, { uuid: '4', description: 'Segment 4' }];
        rerender({ segments: newSegments });

        expect(result.current.localSegments).toEqual(newSegments);
    });
});
