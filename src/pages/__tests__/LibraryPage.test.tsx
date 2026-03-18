import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LibraryPage from '../LibraryPage';
import { renderWithRouter, createSegmentedVideo } from '../../test/helpers';
import { api } from '../../services/api';

// Mock the API to avoid real delays and for easier control
vi.mock('../../services/api', () => ({
    api: {
        getSegmentedVideos: vi.fn(),
        getSegments: vi.fn(),
    }
}));

describe('LibraryPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading spinner initially', async () => {
        (api.getSegmentedVideos as any).mockReturnValue(new Promise(() => { })); // Never resolves
        const { container } = renderWithRouter(<LibraryPage />);

        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows empty state when no videos exist', async () => {
        (api.getSegmentedVideos as any).mockResolvedValue([]);
        (api.getSegments as any).mockResolvedValue([]);

        renderWithRouter(<LibraryPage />);

        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Начнем обучение?')).toBeInTheDocument();
        expect(screen.getByText(/Создайте первое и добавьте сегмент/i)).toBeInTheDocument();

        const createBtn = screen.getByRole('link', { name: /Создать сегментированное видео/i });
        expect(createBtn).toHaveAttribute('href', '/segmented-videos/new');
    });

    it('renders shelves when videos exist', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({ name: 'My Collection' }, 2);
        (api.getSegmentedVideos as any).mockResolvedValue([segmentedVideo]);
        (api.getSegments as any).mockResolvedValue(segments);

        renderWithRouter(<LibraryPage />);

        await waitFor(() => {
            expect(screen.getByText('My Collection')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText((content) => content.includes('егментов: 2'))).toBeInTheDocument();
        });

        // Check "все" link
        const allLink = screen.getByText(/все/i).closest('a');
        expect(allLink).toHaveAttribute('href', `/segmented-videos/${segmentedVideo.uuid}`);

        // Check segment cards (descriptions)
        // Check segment cards (descriptions usually go to alt in thumbnail)
        expect(screen.getByAltText('Segment 1')).toBeInTheDocument();
        expect(screen.getByAltText('Segment 2')).toBeInTheDocument();
    });

    it('has a plus button in the header leading to create page', async () => {
        const video = { uuid: '1', name: 'Dummy', segmentIds: ['seg1'] };
        const segment = { uuid: 'seg1', description: 'Seg1', timeStart: 0, timeEnd: 10, video: { ...video, youtubeId: 'abc' } };
        (api.getSegmentedVideos as any).mockResolvedValue([video]);
        (api.getSegments as any).mockResolvedValue([segment]);

        renderWithRouter(<LibraryPage />);

        await waitFor(() => {
            expect(screen.getByText('Dummy')).toBeInTheDocument();
        });

        const addButton = screen.getByText('Добавить').closest('a');
        expect(addButton).toHaveAttribute('href', '/segmented-videos/new');
        expect(addButton).toHaveAttribute('href', '/segmented-videos/new');
    });
});
