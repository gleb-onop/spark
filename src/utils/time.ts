/**
 * Parses time string like "1:30" or "90" into seconds.
 */
export const parseTime = (str: string | null): number => {
    if (!str) return 0;
    if (str.includes(':')) {
        const [m, s] = str.split(':').map(Number);
        return (m || 0) * 60 + (s || 0);
    }
    return Number(str) || 0;
};

/**
 * Formats seconds into "m:ss" format.
 */
export const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};
