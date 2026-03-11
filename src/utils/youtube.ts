export interface YTPlayer {
    destroy(): void;
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    setVolume(volume: number): void;
    getVolume(): number;
    setPlaybackRate(suggestedRate: number): void;
    getPlaybackRate(): number;
    getDuration(): number;
    getCurrentTime(): number;
    getPlayerState(): number;
}

export interface YTEvent {
    target: YTPlayer;
    data: any;
}

export interface YTPlayerOptions {
    videoId: string;
    playerVars?: {
        autoplay?: 0 | 1;
        controls?: 0 | 1 | 2;
        modestbranding?: 1;
        rel?: 0 | 1;
        showinfo?: 0 | 1;
        iv_load_policy?: 1 | 3;
        mute?: 0 | 1;
        start?: number;
        [key: string]: any;
    };
    events?: {
        onReady?: (event: YTEvent) => void;
        onStateChange?: (event: YTEvent) => void;
        [key: string]: any;
    };
}

declare global {
    interface Window {
        YT: {
            Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
            PlayerState: {
                ENDED: number;
                PLAYING: number;
                PAUSED: number;
                BUFFERING: number;
                CUED: number;
            };
        };
        onYouTubeIframeAPIReady: () => void;
    }
}


let isApiLoading = false;
let apiResolvers: (() => void)[] = [];

const YT_API_TIMEOUT_MS = 5000;
const YT_API_POLL_INTERVAL_MS = 100;

/**
 * Ensures that the YouTube IFrame API is loaded and returns a promise
 * that resolves when it's ready.
 */
export function ensureYouTubeIframeAPIReady(): Promise<void> {
    return new Promise((resolve) => {
        if (window.YT && window.YT.Player) {
            resolve();
            return;
        }

        apiResolvers.push(resolve);

        if (isApiLoading) return;
        isApiLoading = true;

        const timeout = setTimeout(() => {
            if (isApiLoading) {
                console.warn('YouTube IFrame API load timeout - resolving anyway');
                apiResolvers.forEach(res => res());
                apiResolvers = [];
                isApiLoading = false;
            }
        }, YT_API_TIMEOUT_MS);

        // Check if script is already added but not ready
        const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
        if (existingScript) {
            const check = setInterval(() => {
                if (window.YT && window.YT.Player) {
                    clearInterval(check);
                    clearTimeout(timeout);
                    apiResolvers.forEach(res => res());
                    apiResolvers = [];
                    isApiLoading = false;
                }
            }, YT_API_POLL_INTERVAL_MS);
            return;
        }

        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            clearTimeout(timeout);
            apiResolvers.forEach(res => res());
            apiResolvers = [];
            isApiLoading = false;
        };
    });
}
