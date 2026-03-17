import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SegmentedVideoPage from '../SegmentedVideoPage';
import { renderWithRouter, createSegmentedVideo } from '../../test/helpers';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
    api: {
        getSegmentedVideo: vi.fn(),
        getSegmentsByUuids: vi.fn(),
        deleteSegmentedVideo: vi.fn(),
    }
}));

describe('SegmentedVideoPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading spinner initially', async () => {
        (api.getSegmentedVideo as any).mockReturnValue(new Promise(() => { }));
        const { container } = renderWithRouter(<SegmentedVideoPage />, {
            routePath: '/segmented-videos/:segmentedVideoId',
            routerProps: { initialEntries: ['/segmented-videos/123'] }
        });

        await waitFor(() => {
            expect(container.querySelector('.animate-spin')).toBeInTheDocument();
        });
    });

    it('shows error state if video not found', async () => {
        (api.getSegmentedVideo as any).mockResolvedValue(undefined);

        renderWithRouter(<SegmentedVideoPage />, {
            routePath: '/segmented-videos/:segmentedVideoId',
            routerProps: { initialEntries: ['/segmented-videos/missing'] }
        });

        await waitFor(() => {
            expect(screen.getByText(/Сегментированное видео не найдено/i)).toBeInTheDocument();
        });
    });

    it('renders video info and segments list', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({ name: 'Deep Learning' }, 2);
        (api.getSegmentedVideo as any).mockResolvedValue(segmentedVideo);
        (api.getSegmentsByUuids as any).mockResolvedValue(segments);

        renderWithRouter(<SegmentedVideoPage />, {
            routePath: '/segmented-videos/:segmentedVideoId',
            routerProps: { initialEntries: [`/segmented-videos/${segmentedVideo.uuid}`] }
        });

        await waitFor(() => {
            expect(screen.getAllByText('Deep Learning').length).toBeGreaterThan(0);
        });

        expect(screen.getAllByText(/Сегментов: 2/i).length).toBeGreaterThan(0);
        expect(screen.getByText('Segment 1')).toBeInTheDocument();
        expect(screen.getByText('Segment 2')).toBeInTheDocument();

        // Check timestamps formatting
        expect(screen.getAllByText('0:30 – 1:45')).toHaveLength(2);
    });

    it('shows empty collection state', async () => {
        const { segmentedVideo } = createSegmentedVideo({ name: 'Empty' }, 0);
        (api.getSegmentedVideo as any).mockResolvedValue(segmentedVideo);
        (api.getSegmentsByUuids as any).mockResolvedValue([]);

        renderWithRouter(<SegmentedVideoPage />, {
            routePath: '/segmented-videos/:segmentedVideoId',
            routerProps: { initialEntries: [`/segmented-videos/${segmentedVideo.uuid}`] }
        });

        await waitFor(() => {
            expect(screen.getByText(/Сегментированное видео пусто/i)).toBeInTheDocument();
        });
        expect(screen.getByText(/Начните изучение, добавив первый сегмент/i)).toBeInTheDocument();
    });

    it('opens delete confirmation dialog and handles deletion', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({ name: 'To Delete' }, 1);
        (api.getSegmentedVideo as any).mockResolvedValue(segmentedVideo);
        (api.getSegmentsByUuids as any).mockResolvedValue(segments);
        (api.deleteSegmentedVideo as any).mockResolvedValue(undefined);

        renderWithRouter(<SegmentedVideoPage />, {
            routePath: '/segmented-videos/:segmentedVideoId',
            routerProps: { initialEntries: [`/segmented-videos/${segmentedVideo.uuid}`] }
        });

        await waitFor(() => expect(screen.getAllByText('To Delete').length).toBeGreaterThan(0));

        // Open menu and click delete
        // Multiple menus can exist because of the mobile and desktop headers
        const menuBtns = screen.getAllByRole('button', { name: /Дополнительно/i }).filter(btn => btn.tagName.toLowerCase() === 'button');
        fireEvent.click(menuBtns[0]);

        const deleteItem = screen.getByText(/Удалить сегментированное видео/i);
        fireEvent.click(deleteItem);

        // Confirmation dialog
        expect(screen.getByText(/Вы уверены, что хотите удалить "To Delete"?/i)).toBeInTheDocument();

        const confirmBtn = screen.getByRole('button', { name: /Удалить/i });
        fireEvent.click(confirmBtn);

        expect(api.deleteSegmentedVideo).toHaveBeenCalledWith(segmentedVideo.uuid);
    });

    it('play button leads to first segment player', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({}, 2);
        (api.getSegmentedVideo as any).mockResolvedValue(segmentedVideo);
        (api.getSegmentsByUuids as any).mockResolvedValue(segments);

        renderWithRouter(<SegmentedVideoPage />, {
            routePath: '/segmented-videos/:segmentedVideoId',
            routerProps: { initialEntries: [`/segmented-videos/${segmentedVideo.uuid}`] }
        });

        await waitFor(() => expect(screen.getAllByText(/Сегментов: 2/i).length).toBeGreaterThan(0));

        const playBtn = screen.getByText('Воспроизвести').closest('a');
        expect(playBtn).toHaveAttribute('href', `/segmented-videos/${segmentedVideo.uuid}/segments/${segments[0].uuid}`);
    });
});
