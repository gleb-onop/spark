import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SegmentsProgressBar } from '../SegmentsProgressBar';
import { MemoryRouter } from 'react-router-dom';

const mockSegments = [
    {
        uuid: '1',
        timeStart: '0:00',
        timeEnd: '1:00',
        description: 'Seg 1',
        video: { duration: 120 }
    },
    {
        uuid: '2',
        timeStart: '1:00',
        timeEnd: '2:00',
        description: 'Seg 2',
        video: { duration: 120 }
    },
];

vi.mock('@/utils/time', () => ({
    parseTime: vi.fn((t: string) => {
        if (t === '0:00') return 0;
        if (t === '1:00') return 60;
        if (t === '2:00') return 120;
        return 0;
    }),
    formatTime: vi.fn((s: number) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins}:${String(secs).padStart(2, '0')}`;
    }),
}));

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

    it('should highlight current segment and show progress based on progressPct', () => {
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

        const progressDiv = screen.getByTestId('segment-progress');
        expect(progressDiv).toBeInTheDocument();
        expect(progressDiv).toHaveStyle('width: 50%');
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

    it('should show tooltip on hover in overlay mode with correct time', async () => {
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

        // Find the link by label
        const firstSegmentLink = screen.getByRole('link', { name: /Seg 1/i });
        const container = firstSegmentLink.closest('.group');
        if (!container) throw new Error('Container not found');

        // Mock getBoundingClientRect for container
        container.getBoundingClientRect = vi.fn().mockReturnValue({
            left: 0,
            width: 100,
            top: 0,
            height: 10,
        });

        fireEvent.mouseMove(container, { clientX: 50 });

        // Total duration is 120s (from our mock logic)
        // 50% of 120s is 60s -> formatTime(60) -> "1:00"
        expect(await screen.findByText('1:00')).toBeInTheDocument();
    });
});
