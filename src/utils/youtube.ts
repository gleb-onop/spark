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
    getPlayerState(): number;
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

/**
 * Parses YouTube timestamp formats like "90", "1m30s", "1h2m3s" into seconds.
 */
export const parseYouTubeTimestamp = (t: string | null): number => {
    if (!t) return 0;

    // Numeric format (seconds)
    if (/^\d+$/.test(t)) return Number(t);

    // YouTube format (e.g., 1h2m3s)
    let totalSeconds = 0;
    const hoursMatch = t.match(/(\d+)h/);
    const minsMatch = t.match(/(\d+)m/);
    const secsMatch = t.match(/(\d+)s/);

    if (hoursMatch) totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
    if (minsMatch) totalSeconds += parseInt(minsMatch[1], 10) * 60;
    if (secsMatch) totalSeconds += parseInt(secsMatch[1], 10);

    return totalSeconds;
};

/**
 * Extracts YouTube video ID and initial timestamp from a URL or plain ID.
 */
export const extractYouTubeMetadata = (input: string): {
    videoId: string | null;
    initialTimestamp: number | null;
    error: string | null;
} => {
    if (!input) {
        return { videoId: null, initialTimestamp: null, error: null };
    }

    let videoId = '';
    let t: string | null = null;

    try {
        const urlObj = new URL(input.startsWith('http') ? input : `https://${input}`);
        const hostname = urlObj.hostname.replace('www.', '');
        const pathname = urlObj.pathname;

        // Block specific unsupported formats
        if (hostname.includes('youtube.com')) {
            if (pathname === '/playlist' || (pathname === '/' && urlObj.searchParams.has('list'))) {
                return { videoId: null, initialTimestamp: null, error: 'Списки воспроизведения не поддерживаются' };
            }
            if (pathname.startsWith('/embed/')) {
                return { videoId: null, initialTimestamp: null, error: 'Встроенные видео (embed) не поддерживаются' };
            }
            if (pathname.startsWith('/live') || pathname === '/live') {
                return { videoId: null, initialTimestamp: null, error: 'Прямые трансляции (live) не поддерживаются' };
            }
        }

        if (hostname.includes('youtu.be')) {
            videoId = pathname.slice(1);
        } else if (urlObj.searchParams.has('v')) {
            videoId = urlObj.searchParams.get('v') || '';
        } else if (pathname.startsWith('/v/')) {
            videoId = pathname.slice(3).split('?')[0];
        } else if (pathname.startsWith('/shorts/')) {
            videoId = pathname.split('/')[2] || '';
        } else {
            const pathParts = pathname.split('/').filter(Boolean);
            videoId = pathParts[pathParts.length - 1] || '';
        }

        t = urlObj.searchParams.get('t') || urlObj.searchParams.get('start');
    } catch (e) {
        // Ignore, it might be just an 11-char ID
    }

    // Fallback for plain ID if it's a valid-looking 11-char ID
    if (!videoId && /^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
        videoId = input.trim();
    }

    if (videoId) {
        return {
            videoId,
            initialTimestamp: t ? parseYouTubeTimestamp(t) : null,
            error: null
        };
    }

    return {
        videoId: null,
        initialTimestamp: null,
        error: 'Не удалось распознать ссылку'
    };
};

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

const oembedCache = new Map<string, YTMetadata>();

/**
 * Fetches YouTube oEmbed metadata for a video.
 */
export async function getYouTubeOEmbed(videoId: string): Promise<YTMetadata> {
    if (oembedCache.has(videoId)) {
        return oembedCache.get(videoId)!;
    }

    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch YouTube oEmbed metadata');
    }

    const data = await response.json();
    oembedCache.set(videoId, data);
    return data;
}
