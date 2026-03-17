import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTheme } from '../use-theme';

const THEME_KEY = "spark_theme";

describe('useTheme', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.className = '';

        // Mock matchMedia implementation for each test
        vi.stubGlobal('matchMedia', vi.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })));
    });

    it('initializes with light theme by default if no preference or saved value', () => {
        const { result } = renderHook(() => useTheme());
        expect(result.current.theme).toBe('light');
        expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('initializes with dark theme if system preference is dark', () => {
        vi.stubGlobal('matchMedia', vi.fn().mockImplementation(query => ({
            matches: query === '(prefers-color-scheme: dark)',
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
        })));

        const { result } = renderHook(() => useTheme());
        expect(result.current.theme).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('initializes with saved value from localStorage', () => {
        localStorage.setItem(THEME_KEY, 'dark');
        const { result } = renderHook(() => useTheme());
        expect(result.current.theme).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('toggles theme and updates document and localStorage', () => {
        const { result } = renderHook(() => useTheme());

        act(() => {
            result.current.toggleTheme();
        });

        expect(result.current.theme).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(localStorage.getItem(THEME_KEY)).toBe('dark');

        act(() => {
            result.current.toggleTheme();
        });

        expect(result.current.theme).toBe('light');
        expect(document.documentElement.classList.contains('light')).toBe(true);
        expect(localStorage.getItem(THEME_KEY)).toBe('light');
    });
});
