import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ShelfCard from '../ShelfCard';

vi.mock('../SegmentThumbnail', () => ({
    SegmentThumbnail: () => <div data-testid="thumbnail" />
}));

describe('ShelfCard', () => {
    it('placeholder: renders link leading to .../segments/new', () => {
        render(<ShelfCard isPlaceholder segmentedVideoId="video-1" />, { wrapper: MemoryRouter });
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/segmented-videos/video-1/segments/new');
    });

    it('placeholder: renders "Добавить" text', () => {
        render(<ShelfCard isPlaceholder segmentedVideoId="video-1" />, { wrapper: MemoryRouter });
        expect(screen.getByText('Добавить')).toBeInTheDocument();
    });

    it('normal variant with segment: renders link to correct segment URL', () => {
        const mockSegment = {
            uuid: 'seg-123',
            description: 'Test Segment',
            video: { youtubeId: 'abcd' }
        };
        render(<ShelfCard segment={mockSegment as any} segmentedVideoId="video-1" />, { wrapper: MemoryRouter });
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/segmented-videos/video-1/segments/seg-123');
    });

    it('normal variant: renders SegmentThumbnail', () => {
        const mockSegment = {
            uuid: 'seg-123',
            description: 'Test Segment',
            video: { youtubeId: 'abcd' }
        };
        render(<ShelfCard segment={mockSegment as any} segmentedVideoId="video-1" />, { wrapper: MemoryRouter });
        expect(screen.getByTestId('thumbnail')).toBeInTheDocument();
    });

    it('returns null when isPlaceholder false and segment is missing', () => {
        const { container } = render(<ShelfCard segmentedVideoId="video-1" />, { wrapper: MemoryRouter });
        expect(container.firstChild).toBeNull();
    });
});
