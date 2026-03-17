import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useLoopSetting } from '../useLoopSetting';

const STORAGE_KEY = 'spark_looping';

describe('useLoopSetting', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('initializes with false by default', () => {
        const { result } = renderHook(() => useLoopSetting());
        expect(result.current.isLooping).toBe(false);
    });

    it('initializes with value from localStorage', () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        const { result } = renderHook(() => useLoopSetting());
        expect(result.current.isLooping).toBe(true);
    });

    it('toggles looping and updates localStorage', () => {
        const { result } = renderHook(() => useLoopSetting());

        act(() => {
            result.current.toggleLoop(true);
        });

        expect(result.current.isLooping).toBe(true);
        expect(localStorage.getItem(STORAGE_KEY)).toBe('true');

        act(() => {
            result.current.toggleLoop(false);
        });

        expect(result.current.isLooping).toBe(false);
        expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
    });
});
