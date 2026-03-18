import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LibraryPage from '../LibraryPage';
import { renderWithRouter, createSegmentedVideo } from '../../test/helpers';
import { useSegmentedVideos } from '../../hooks/useSegmentedVideos';

// Mock the hook instead of the API directly for better isolation
vi.mock('../../hooks/useSegmentedVideos', () => ({
    useSegmentedVideos: vi.fn(),
}));

describe('LibraryPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading spinner initially', async () => {
        (useSegmentedVideos as any).mockReturnValue({
            segmentedVideos: [],
            segments: [],
            isLoading: true,
        });

        renderWithRouter(<LibraryPage />);

        expect(screen.getByLabelText('Загрузка')).toBeInTheDocument();
    });

    it('shows empty state when no videos exist', async () => {
        (useSegmentedVideos as any).mockReturnValue({
            segmentedVideos: [],
            segments: [],
            isLoading: false,
        });

        renderWithRouter(<LibraryPage />);

        expect(screen.getByText('Начнем обучение?')).toBeInTheDocument();
        expect(screen.getByText(/Создайте первое и добавьте сегмент/i)).toBeInTheDocument();

        const createBtn = screen.getByRole('link', { name: /Создать сегментированное видео/i });
        expect(createBtn).toHaveAttribute('href', '/segmented-videos/new');
    });

    it('renders shelves when videos exist', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({
            name: 'My Collection'
        }, 2);

        // Give explicit descriptions to avoid helper default collision
        segments[0].description = 'First Unique Segment';
        segments[1].description = 'Second Unique Segment';

        (useSegmentedVideos as any).mockReturnValue({
            segmentedVideos: [segmentedVideo],
            segments: segments,
            isLoading: false,
        });

        renderWithRouter(<LibraryPage />);

        expect(screen.getByText('My Collection')).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('егментов: 2'))).toBeInTheDocument();

        // Check "все" link
        const allLink = screen.getByText(/все/i).closest('a');
        expect(allLink).toHaveAttribute('href', `/segmented-videos/${segmentedVideo.uuid}`);

        // Check segment cards (descriptions)
        expect(screen.getByAltText('First Unique Segment')).toBeInTheDocument();
        expect(screen.getByAltText('Second Unique Segment')).toBeInTheDocument();
    });

    it('has a plus button in the header leading to create page', async () => {
        (useSegmentedVideos as any).mockReturnValue({
            segmentedVideos: [{ uuid: '1', name: 'Dummy', segmentIds: ['seg1'] }],
            segments: [{ uuid: 'seg1', description: 'Seg1', timeStart: 0, timeEnd: 10, video: { youtubeId: 'abc' } }],
            isLoading: false,
        });

        renderWithRouter(<LibraryPage />);

        // PageHeader actions button (can be mobile icon-only or desktop text)
        const addLinks = screen.getAllByRole('link', { name: /Добавить/i });
        addLinks.forEach(link => expect(link).toHaveAttribute('href', '/segmented-videos/new'));
    });
});
