import { describe, it, expect } from 'vitest';
import { parseYouTubeTimestamp } from '../youtube';

describe('youtube utils', () => {
    describe('parseYouTubeTimestamp', () => {
        it('parses numeric seconds', () => {
            expect(parseYouTubeTimestamp('90')).toBe(90);
        });

        it('parses hms format', () => {
            expect(parseYouTubeTimestamp('1h2m3s')).toBe(3723);
        });

        it('parses ms format', () => {
            expect(parseYouTubeTimestamp('2m30s')).toBe(150);
        });

        it('parses partial formats', () => {
            expect(parseYouTubeTimestamp('1h5s')).toBe(3605);
            expect(parseYouTubeTimestamp('10m')).toBe(600);
        });

        it('returns 0 for empty or null input', () => {
            expect(parseYouTubeTimestamp('')).toBe(0);
            expect(parseYouTubeTimestamp(null)).toBe(0);
        });
    });
});
