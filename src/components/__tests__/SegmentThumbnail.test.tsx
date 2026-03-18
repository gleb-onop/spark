import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SegmentThumbnail } from '../SegmentThumbnail';
import { useYouTubeOEmbed } from '@/hooks/useYouTubeOEmbed';

vi.mock('@/hooks/useYouTubeOEmbed', () => ({
    useYouTubeOEmbed: vi.fn(),
}));

describe('SegmentThumbnail', () => {
    const defaultProps = {
        youtubeId: 'test-id',
        title: 'Video Title',
    };

    it('renders img with src from hook', () => {
        (useYouTubeOEmbed as any).mockReturnValue({ thumbnailUrl: 'https://img.youtube.com/test.jpg' });
        render(<SegmentThumbnail {...defaultProps} />);
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'https://img.youtube.com/test.jpg');
    });

    it('renders img with alt equal to title prop', () => {
        (useYouTubeOEmbed as any).mockReturnValue({ thumbnailUrl: 'https://img.youtube.com/test.jpg' });
        render(<SegmentThumbnail {...defaultProps} />);
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('alt', 'Video Title');
    });

    it('does not render time badge in sm size even if timeStart provided', () => {
        (useYouTubeOEmbed as any).mockReturnValue({ thumbnailUrl: 'test' });
        render(<SegmentThumbnail {...defaultProps} size="sm" timeStart="0:30" />);
        expect(screen.queryByText(/0:30/)).not.toBeInTheDocument();
    });

    it('renders time badge in md size when timeStart provided', () => {
        (useYouTubeOEmbed as any).mockReturnValue({ thumbnailUrl: 'test' });
        render(<SegmentThumbnail {...defaultProps} size="md" timeStart="0:30" />);
        expect(screen.getByText(/0:30/)).toBeInTheDocument();
    });

    it('does not render time badge when timeStart is missing', () => {
        (useYouTubeOEmbed as any).mockReturnValue({ thumbnailUrl: 'test' });
        render(<SegmentThumbnail {...defaultProps} size="md" />);
        expect(screen.queryByText(/0:30/)).not.toBeInTheDocument();
    });
});
