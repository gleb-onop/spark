import { describe, it, expect } from 'vitest';
import { parseYouTubeTimestamp, extractYouTubeMetadata } from '../utils';

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

    describe('extractYouTubeMetadata', () => {
        it('extracts ID from standard watch URL', () => {
            const result = extractYouTubeMetadata('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
            expect(result.videoId).toBe('dQw4w9WgXcQ');
            expect(result.error).toBeNull();
        });

        it('extracts ID and timestamp from watch URL', () => {
            const result = extractYouTubeMetadata('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90');
            expect(result.videoId).toBe('dQw4w9WgXcQ');
            expect(result.initialTimestamp).toBe(90);
        });

        it('extracts ID from youtu.be short URL', () => {
            const result = extractYouTubeMetadata('https://youtu.be/dQw4w9WgXcQ');
            expect(result.videoId).toBe('dQw4w9WgXcQ');
        });

        it('extracts ID and timestamp from youtu.be short URL', () => {
            const result = extractYouTubeMetadata('https://youtu.be/dQw4w9WgXcQ?t=1m30s');
            expect(result.videoId).toBe('dQw4w9WgXcQ');
            expect(result.initialTimestamp).toBe(90);
        });

        it('extracts ID from shorts URL', () => {
            const result = extractYouTubeMetadata('https://www.youtube.com/shorts/dQw4w9WgXcQ');
            expect(result.videoId).toBe('dQw4w9WgXcQ');
        });

        it('handles plain 11-character IDs', () => {
            const result = extractYouTubeMetadata('dQw4w9WgXcQ');
            expect(result.videoId).toBe('dQw4w9WgXcQ');
        });

        it('extracts ID from legacy /v/ URL', () => {
            const result = extractYouTubeMetadata('https://www.youtube.com/v/dQw4w9WgXcQ');
            expect(result.videoId).toBe('dQw4w9WgXcQ');
        });

        it('returns specific error for playlists', () => {
            const result = extractYouTubeMetadata('https://www.youtube.com/playlist?list=PL63B6931050F0058C');
            expect(result.error).toBe('Списки воспроизведения не поддерживаются');
            expect(result.videoId).toBeNull();
        });

        it('returns specific error for embeds', () => {
            const result = extractYouTubeMetadata('https://www.youtube.com/embed/dQw4w9WgXcQ');
            expect(result.error).toBe('Встроенные видео (embed) не поддерживаются');
            expect(result.videoId).toBeNull();
        });

        it('returns specific error for live streams', () => {
            const result = extractYouTubeMetadata('https://www.youtube.com/live/dQw4w9WgXcQ');
            expect(result.error).toBe('Прямые трансляции (live) не поддерживаются');
            expect(result.videoId).toBeNull();
        });

        it('handles start parameter', () => {
            const result = extractYouTubeMetadata('https://www.youtube.com/watch?v=dQw4w9WgXcQ&start=120');
            expect(result.initialTimestamp).toBe(120);
        });

        it('returns error for invalid input', () => {
            const result = extractYouTubeMetadata('not-a-youtube-url-at-all');
            expect(result.videoId).toBeNull();
            expect(result.error).toBe('Не удалось распознать ссылку');
        });

        it('handles empty input', () => {
            const result = extractYouTubeMetadata('');
            expect(result.videoId).toBeNull();
            expect(result.error).toBeNull();
        });
    });
});
