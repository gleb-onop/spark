import { describe, it, expect } from 'vitest';
import { parseTime, formatTime } from '../time';

describe('time utils', () => {
    describe('parseTime', () => {
        it('parses m:ss format', () => {
            expect(parseTime('1:30')).toBe(90);
        });

        it('parses h:mm:ss format', () => {
            expect(parseTime('1:02:30')).toBe(3750);
        });

        it('parses format with milliseconds', () => {
            expect(parseTime('0:30.500')).toBe(30.5);
        });

        it('parses plain seconds', () => {
            expect(parseTime('90')).toBe(90);
        });

        it('returns 0 for empty or null input', () => {
            expect(parseTime('')).toBe(0);
            expect(parseTime(null)).toBe(0);
        });

        it('handles trim and whitespace', () => {
            expect(parseTime('  1:30  ')).toBe(90);
        });
    });

    describe('formatTime', () => {
        it('formats seconds to m:ss', () => {
            expect(formatTime(90)).toBe('1:30');
        });

        it('formats seconds to h:mm:ss', () => {
            expect(formatTime(3750)).toBe('1:02:30');
        });

        it('formats with leading zero for minutes if hours exist', () => {
            expect(formatTime(3665)).toBe('1:01:05');
        });

        it('includes milliseconds when requested', () => {
            expect(formatTime(30.5, true)).toBe('0:30.500');
        });

        it('pads milliseconds correctly', () => {
            expect(formatTime(30.005, true)).toBe('0:30.005');
            expect(formatTime(30.05, true)).toBe('0:30.050');
        });
    });
});
