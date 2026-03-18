import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useYouTubeMetadata } from '../useYouTubeMetadata';

describe('useYouTubeMetadata', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('parses watch v= link', () => {
        const { result } = renderHook(({ url }) => useYouTubeMetadata(url), {
            initialProps: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current.youtubeId).toBe('dQw4w9WgXcQ');
        expect(result.current.urlError).toBe('');
    });

    it('parses youtu.be link', () => {
        const { result } = renderHook(() => useYouTubeMetadata('https://youtu.be/dQw4w9WgXcQ'));

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current.youtubeId).toBe('dQw4w9WgXcQ');
    });

    it('parses shorts link', () => {
        const { result } = renderHook(() => useYouTubeMetadata('https://www.youtube.com/shorts/dQw4w9WgXcQ'));

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current.youtubeId).toBe('dQw4w9WgXcQ');
    });

    it('parses plain 11-char ID', () => {
        const { result } = renderHook(() => useYouTubeMetadata('dQw4w9WgXcQ'));

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current.youtubeId).toBe('dQw4w9WgXcQ');
    });

    it('extracts initial timestamp from t= parameter', () => {
        const { result } = renderHook(() => useYouTubeMetadata('https://www.youtube.com/watch?v=ABC&t=90'));

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current.initialTimestamp).toBe(90);
    });

    it('sets error for invalid link', () => {
        const { result } = renderHook(() => useYouTubeMetadata('invalid-link'));

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current.youtubeId).toBe('');
        expect(result.current.urlError).toBe('Не удалось распознать ссылку');
    });

    it('clears metadata for empty URL', () => {
        const { result, rerender } = renderHook(({ url }) => useYouTubeMetadata(url), {
            initialProps: { url: 'dQw4w9WgXcQ' }
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });
        expect(result.current.youtubeId).toBe('dQw4w9WgXcQ');

        rerender({ url: '' });
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current.youtubeId).toBe('');
        expect(result.current.urlError).toBe('');
    });
});
