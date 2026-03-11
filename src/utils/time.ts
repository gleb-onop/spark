/**
 * Parses time string like "1:30" or "1:30.500" or "90" into seconds.
 */
export const parseTime = (str: string | null): number => {
    if (!str) return 0;
    if (str.includes(':')) {
        const [m, rest] = str.split(':');
        const [s, ms] = (rest || '').split('.');
        const minutes = Number(m) || 0;
        const seconds = Number(s) || 0;

        // Handle ms based on length (e.g. .5 -> 500ms, .50 -> 500ms, .500 -> 500ms)
        const msSeconds = ms ? Number(`0.${ms}`) : 0;

        return minutes * 60 + seconds + msSeconds;
    }
    return Number(str) || 0;
};

/**
 * Formats seconds into "m:ss" or "m:ss.SSS" format.
 */
export const formatTime = (seconds: number, includeMs = false): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const mainPart = `${m}:${s.toString().padStart(2, '0')}`;

    if (includeMs) {
        const ms = Math.round((seconds % 1) * 1000);
        return `${mainPart}.${ms.toString().padStart(3, '0')}`;
    }

    return mainPart;
};
