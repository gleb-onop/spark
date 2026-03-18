import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import React from 'react';

// Mock useYouTubeBase globally
vi.mock('@/hooks/useYouTubeBase', () => ({
    useYouTubeBase: vi.fn().mockImplementation(({ playerRef, events }) => {

        React.useEffect(() => {
            if (!playerRef) return;
            const mockPlayer = {
                destroy: vi.fn(),
                playVideo: vi.fn(),
                pauseVideo: vi.fn(),
                seekTo: vi.fn(),
                getCurrentTime: vi.fn().mockReturnValue(0),
                getDuration: vi.fn().mockReturnValue(120),
                getPlayerState: vi.fn().mockReturnValue(-1),
                mute: vi.fn(),
                unMute: vi.fn(),
                isMuted: vi.fn().mockReturnValue(false),
                setVolume: vi.fn(),
                getVolume: vi.fn().mockReturnValue(100),
            };
            playerRef.current = mockPlayer;
            // Simulate onReady async to allow effects to settle
            const timer = setTimeout(() => {
                events?.onReady?.({ target: mockPlayer });
            }, 0);
            return () => clearTimeout(timer);
        }, []); // Empty dependencies to avoid infinite loops from inline events object
        return { player: playerRef?.current || null, playerRef };
    }),
}));

// Mock screen.orientation
Object.defineProperty(window.screen, 'orientation', {
    writable: true,
    value: {
        type: 'portrait-primary',
        angle: 0,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }
});

// Mock document.fullscreenEnabled
Object.defineProperty(document, 'fullscreenEnabled', {
    writable: true,
    value: true,
});

// Mock Fullscreen API methods
Element.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined);
if (typeof document !== 'undefined') {
    (document as any).exitFullscreen = vi.fn().mockResolvedValue(undefined);
}

// Cleanup after each test
afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
});

// Mock YouTube IFrame API
Object.defineProperty(window, 'YT', {
    writable: true,
    configurable: true,
    value: {
        Player: vi.fn().mockImplementation(function () {
            return {
                destroy: vi.fn(),
                playVideo: vi.fn(),
                pauseVideo: vi.fn(),
                seekTo: vi.fn(),
                getCurrentTime: vi.fn().mockReturnValue(0),
                getDuration: vi.fn().mockReturnValue(120),
                getPlayerState: vi.fn().mockReturnValue(-1),
                mute: vi.fn(),
                unMute: vi.fn(),
                isMuted: vi.fn().mockReturnValue(false),
                setVolume: vi.fn(),
                getVolume: vi.fn().mockReturnValue(100),
            };
        }),
        PlayerState: {
            UNSTARTED: -1,
            ENDED: 0,
            PLAYING: 1,
            PAUSED: 2,
            BUFFERING: 3,
            CUED: 5,
        },
    },
});

// Mock requestAnimationFrame
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(cb, 0) as unknown as number);
vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));

// Mock scrollBy for shelf scroll tests
Element.prototype.scrollBy = vi.fn();

// Mock window.resizeTo
window.resizeTo = vi.fn().mockImplementation((width: number, height: number) => {
    Object.assign(window, {
        innerWidth: width,
        innerHeight: height,
        outerWidth: width,
        outerHeight: height,
    }).dispatchEvent(new Event('resize'));
});
