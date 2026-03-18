import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SegmentedVideoPage from '../SegmentedVideoPage';
import { renderWithRouter, createSegmentedVideo } from '../../test/helpers';
import { useSegmentedVideo } from '../../hooks/useSegmentedVideo';
import { useSegmentReorder } from '../../hooks/useSegmentReorder';

vi.mock('../../hooks/useSegmentedVideo', () => ({
    useSegmentedVideo: vi.fn(),
}));

vi.mock('../../hooks/useSegmentReorder', () => ({
    useSegmentReorder: vi.fn(),
}));

describe('SegmentedVideoPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default reorder mock
        (useSegmentReorder as any).mockReturnValue({
            localSegments: [],
            sensors: [],
            handleDragStart: vi.fn(),
            handleDragEnd: vi.fn(),
            activeSegment: null
        });
    });

    it('shows loading spinner initially', async () => {
        (useSegmentedVideo as any).mockReturnValue({
            isLoading: true,
            segmentedVideo: null,
            segments: []
        });

        renderWithRouter(<SegmentedVideoPage />, {
            routePath: '/segmented-videos/:segmentedVideoId',
            routerProps: { initialEntries: ['/segmented-videos/123'] }
        });

        expect(screen.getByLabelText('Загрузка')).toBeInTheDocument();
    });

    it('shows error state if video not found', async () => {
        (useSegmentedVideo as any).mockReturnValue({
            isLoading: false,
            segmentedVideo: null,
            segments: []
        });

        renderWithRouter(<SegmentedVideoPage />, {
            routePath: '/segmented-videos/:segmentedVideoId',
            routerProps: { initialEntries: ['/segmented-videos/missing'] }
        });

        expect(screen.getByText(/Сегментированное видео не найдено/i)).toBeInTheDocument();
    });

    it('renders video info and segments list', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({ name: 'Deep Learning' }, 2);
        (useSegmentedVideo as any).mockReturnValue({
            isLoading: false,
            segmentedVideo,
            segments
        });
        (useSegmentReorder as any).mockReturnValue({
            localSegments: segments,
            sensors: [],
            handleDragStart: vi.fn(),
            handleDragEnd: vi.fn(),
            activeSegment: null
        });

        renderWithRouter(<SegmentedVideoPage />, {
            routePath: '/segmented-videos/:segmentedVideoId',
            routerProps: { initialEntries: [`/segmented-videos/${segmentedVideo.uuid}`] }
        });

        expect(screen.getAllByText('Deep Learning').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Сегментов: 2/i).length).toBeGreaterThan(0);
        expect(screen.getByText('Segment 1')).toBeInTheDocument();
        expect(screen.getByText('Segment 2')).toBeInTheDocument();
    });

    it('shows empty collection state', async () => {
        const { segmentedVideo } = createSegmentedVideo({ name: 'Empty' }, 0);
        (useSegmentedVideo as any).mockReturnValue({
            isLoading: false,
            segmentedVideo,
            segments: []
        });

        renderWithRouter(<SegmentedVideoPage />, {
            routePath: '/segmented-videos/:segmentedVideoId',
            routerProps: { initialEntries: [`/segmented-videos/${segmentedVideo.uuid}`] }
        });

        expect(screen.getByText(/Сегментированное видео пусто/i)).toBeInTheDocument();
        expect(screen.getByText(/Начните изучение, добавив первый сегмент/i)).toBeInTheDocument();
    });

    it('opens delete confirmation dialog and handles deletion', async () => {
        const user = userEvent.setup();
        const { segmentedVideo, segments } = createSegmentedVideo({ name: 'To Delete' }, 1);
        const deleteSegmentedVideo = vi.fn().mockResolvedValue(undefined);

        (useSegmentedVideo as any).mockReturnValue({
            isLoading: false,
            segmentedVideo,
            segments,
            deleteSegmentedVideo
        });
        (useSegmentReorder as any).mockReturnValue({
            localSegments: segments,
            sensors: [],
            handleDragStart: vi.fn(),
            handleDragEnd: vi.fn(),
            activeSegment: null
        });

        renderWithRouter(<SegmentedVideoPage />, {
            routePath: '/segmented-videos/:segmentedVideoId',
            routerProps: { initialEntries: [`/segmented-videos/${segmentedVideo.uuid}`] }
        });

        // Open menu and click delete
        const menuBtn = screen.getByRole('button', { name: /Дополнительно/i });
        await user.click(menuBtn);

        const deleteItem = await screen.findByText(/Удалить сегментированное видео/i);
        await user.click(deleteItem);

        // Confirmation dialog - use heading role for the title to be more robust
        expect(await screen.findByRole('heading', { name: /Удалить сегментированное видео\?/i })).toBeInTheDocument();
        // Check for common words in description since the name might be ambiguous with header
        expect(screen.getByText(/Вы уверены, что хотите удалить/i)).toBeInTheDocument();

        const confirmBtn = screen.getByRole('button', { name: /Удалить/i });
        await user.click(confirmBtn);

        await waitFor(() => {
            expect(deleteSegmentedVideo).toHaveBeenCalled();
        });
    });

    it('play button leads to first segment player', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({}, 2);
        (useSegmentedVideo as any).mockReturnValue({
            isLoading: false,
            segmentedVideo,
            segments
        });
        (useSegmentReorder as any).mockReturnValue({
            localSegments: segments,
            sensors: [],
            handleDragStart: vi.fn(),
            handleDragEnd: vi.fn(),
            activeSegment: null
        });

        renderWithRouter(<SegmentedVideoPage />, {
            routePath: '/segmented-videos/:segmentedVideoId',
            routerProps: { initialEntries: [`/segmented-videos/${segmentedVideo.uuid}`] }
        });

        // Use data-testid to target desktop button specifically
        const playBtn = screen.getByTestId('play-button-desktop').closest('a');
        expect(playBtn).toHaveAttribute('href', `/segmented-videos/${segmentedVideo.uuid}/segments/${segments[0].uuid}`);
    });
});
