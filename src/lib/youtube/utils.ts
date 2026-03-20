import type { YTMetadata } from './types';

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
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
            if (pathname === '/playlist' || (pathname === '/' && urlObj.searchParams.has('list'))) {
                return { videoId: null, initialTimestamp: null, error: 'Списки воспроизведения не поддерживаются' };
            }
            if (pathname.startsWith('/embed/')) {
                return { videoId: null, initialTimestamp: null, error: 'Встроенные видео (embed) не поддерживаются' };
            }
            if (pathname.startsWith('/live') || pathname === '/live') {
                return { videoId: null, initialTimestamp: null, error: 'Прямые трансляции (live) не поддерживаются' };
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
        }
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
        error: 'Другие платформы не поддерживаются, только YouTube'
    };
};

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
