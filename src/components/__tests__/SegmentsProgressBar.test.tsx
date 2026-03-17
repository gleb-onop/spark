import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SegmentsProgressBar } from '../SegmentsProgressBar';
import { MemoryRouter } from 'react-router-dom';

const mockSegments = [
    { uuid: '1', timeStart: '0:00', timeEnd: '1:00', description: 'Seg 1' },
    { uuid: '2', timeStart: '1:00', timeEnd: '2:00', description: 'Seg 2' },
];

describe('SegmentsProgressBar', () => {
    it('should render correct number of segments', () => {
        render(
            <MemoryRouter>
                <SegmentsProgressBar
                    segments={mockSegments as any}
                    currentSegmentUuid="1"
                    segmentedVideoId="video-1"
                />
            </MemoryRouter>
        );

        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(2);
    });

    it('should highlight current segment', () => {
        render(
            <MemoryRouter>
                <SegmentsProgressBar
                    segments={mockSegments as any}
                    currentSegmentUuid="1"
                    segmentedVideoId="video-1"
                    progressPct={50}
                />
            </MemoryRouter>
        );

        const links = screen.getAllByRole('link');
        // The current segment should have a child div for progress
        const progressDiv = links[0].querySelector('div[style*="width: 50%"]');
        expect(progressDiv).toBeInTheDocument();
    });

    it('should call onSeek when clicked in overlay mode', () => {
        const onSeek = vi.fn();
        render(
            <MemoryRouter>
                <SegmentsProgressBar
                    segments={mockSegments as any}
                    currentSegmentUuid="1"
                    segmentedVideoId="video-1"
                    isOverlay={true}
                    onSeek={onSeek}
                />
            </MemoryRouter>
        );

        const firstSegment = screen.getAllByRole('link')[0];

        // Mock getBoundingClientRect
        firstSegment.getBoundingClientRect = vi.fn().mockReturnValue({
            left: 0,
            width: 100,
        });

        fireEvent.click(firstSegment, { clientX: 50 });

        expect(onSeek).toHaveBeenCalledWith('1', 50);
    });

    it('should show tooltip on hover in overlay mode', () => {
        render(
            <MemoryRouter>
                <SegmentsProgressBar
                    segments={mockSegments as any}
                    currentSegmentUuid="1"
                    segmentedVideoId="video-1"
                    isOverlay={true}
                />
            </MemoryRouter>
        );

        const container = screen.getByRole('link', { name: /Seg 1/i }).parentElement?.parentElement?.parentElement;
        if (!container) throw new Error('Container not found');

        fireEvent.mouseMove(container, { clientX: 50 });

        // Total duration is 120s (2 segments of 60s each)
        // 50% of 120s is 60s -> 1:00
        expect(screen.getByText('1:00')).toBeInTheDocument();
    });
});
