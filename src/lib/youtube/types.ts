export const YTPlayerState = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
} as const;

export type YTPlayerState = typeof YTPlayerState[keyof typeof YTPlayerState];

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
    getPlayerState(): YTPlayerState;
    addEventListener(event: string, handler: (event: any) => void): void;
    removeEventListener(event: string, handler: (event: any) => void): void;
}

export interface YTEvent {
    target: YTPlayer;
    data: YTPlayerState;
}

export interface YTPlayerOptions {
    width?: number | string;
    height?: number | string;
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
        disablekb?: 0 | 1;
        [key: string]: any;
    };
    events?: {
        onReady?: (event: YTEvent) => void;
        onStateChange?: (event: YTEvent) => void;
        onPlaybackRateChange?: (event: YTEvent) => void;
        onError?: (event: YTEvent) => void;
    };
}

export interface YTMetadata {
    title: string;
    author_name: string;
    author_url: string;
    type: string;
    height: number;
    width: number;
    version: string;
    provider_name: string;
    provider_url: string;
    thumbnail_height: number;
    thumbnail_width: number;
    thumbnail_url: string;
    html: string;
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
