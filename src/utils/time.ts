/**
 * Parses time string like "1:30" or "1:30.500" or "2:01:30" or "90" into seconds.
 */
export const parseTime = (str: string | null): number => {
    if (!str) return 0;

    // Remove any trailing non-digit characters that might come from formatTime(..., true) + some string concat
    const cleanStr = str.trim();

    if (cleanStr.includes(':')) {
        const parts = cleanStr.split(':');
        let h = 0, m = 0, sParts = '';

        if (parts.length === 3) {
            h = parseFloat(parts[0]) || 0;
            m = parseFloat(parts[1]) || 0;
            sParts = parts[2];
        } else if (parts.length === 2) {
            m = parseFloat(parts[0]) || 0;
            sParts = parts[1];
        } else {
            sParts = parts[0];
        }

        const [s, ms] = (sParts || '').split('.');
        const seconds = parseFloat(s) || 0;

        // Handle ms as a decimal fraction: .5 -> 0.5, .05 -> 0.05, .005 -> 0.005
        const msSeconds = ms ? parseFloat(`0.${ms}`) : 0;

        return (h * 3600) + (m * 60) + seconds + msSeconds;
    }

    // Likely just seconds or HHMMSS format (though spec says h:mm:ss)
    return parseFloat(cleanStr) || 0;
};

/**
 * Formats seconds into "h:mm:ss", "m:ss" or "m:ss.SSS" / "h:mm:ss.SSS" format.
 */
export const formatTime = (seconds: number, includeMs = false): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    let mainPart = '';
    if (h > 0) {
        mainPart = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
        mainPart = `${m}:${s.toString().padStart(2, '0')}`;
    }

    if (includeMs) {
        const ms = Math.round((seconds % 1) * 1000);
        return `${mainPart}.${ms.toString().padStart(3, '0')}`;
    }

    return mainPart;
};

