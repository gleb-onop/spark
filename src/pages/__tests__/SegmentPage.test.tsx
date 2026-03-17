import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SegmentPage from '../SegmentPage';
import { renderWithRouter, createSegmentedVideo } from '../../test/helpers';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
    api: {
        getSegmentedVideo: vi.fn(),
        getSegmentsByUuids: vi.fn(),
    }
}));

describe('SegmentPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders collection title and segment info', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({ name: 'Learning React' }, 1);
        const segment = segments[0];
        (api.getSegmentedVideo as any).mockResolvedValue(segmentedVideo);
        (api.getSegmentsByUuids as any).mockResolvedValue(segments);

        renderWithRouter(<SegmentPage />, {
            routerProps: {
                initialEntries: [`/segmented-videos/${segmentedVideo.uuid}/segments/${segment.uuid}`]
            }
        });

        // Spec: Заголовок коллекции - отображается название
        await waitFor(() => {
            expect(screen.getAllByText('Learning React').length).toBeGreaterThan(0);
        });

        // Spec: Описание сегмента
        expect(screen.getByText(segment.description)).toBeInTheDocument();

        // Spec: Временные метки (с миллисекундами)
        expect(screen.getByText('0:30.000 – 1:45.000')).toBeInTheDocument();
    });

    it('handles empty description', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({}, 1);
        segments[0].description = '';
        segments[0].video.description = '';
        (api.getSegmentedVideo as any).mockResolvedValue(segmentedVideo);
        (api.getSegmentsByUuids as any).mockResolvedValue(segments);

        renderWithRouter(<SegmentPage />, {
            routePath: '/segmented-videos/:segmentedVideoId/segments/:segmentId',
            routerProps: { initialEntries: [`/segmented-videos/${segmentedVideo.uuid}/segments/${segments[0].uuid}`] }
        });

        // Spec: Описание сегмента — пустое -> "Нет описания"
        await waitFor(() => {
            expect(screen.getByText(/Нет описания/i)).toBeInTheDocument();
        });
    });

    it('shows loop toggle with correct text', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({}, 1);
        (api.getSegmentedVideo as any).mockResolvedValue(segmentedVideo);
        (api.getSegmentsByUuids as any).mockResolvedValue(segments);

        renderWithRouter(<SegmentPage />, {
            routePath: '/segmented-videos/:segmentedVideoId/segments/:segmentId',
            routerProps: { initialEntries: [`/segmented-videos/${segmentedVideo.uuid}/segments/${segments[0].uuid}`] }
        });

        // Spec: Переключатель зацикливания
        await waitFor(() => {
            expect(screen.getByText('Зациклить сегментированное видео')).toBeInTheDocument();
            expect(screen.getByText('Авто-повтор текущего списка')).toBeInTheDocument();
        });
    });

    it('renders segment list sidebar on desktop', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({ name: 'Course' }, 3);
        (api.getSegmentedVideo as any).mockResolvedValue(segmentedVideo);
        (api.getSegmentsByUuids as any).mockResolvedValue(segments);

        renderWithRouter(<SegmentPage />, {
            routePath: '/segmented-videos/:segmentedVideoId/segments/:segmentId',
            routerProps: { initialEntries: [`/segmented-videos/${segmentedVideo.uuid}/segments/${segments[0].uuid}`] }
        });

        await waitFor(() => {
            expect(screen.getByText('Course')).toBeInTheDocument();
        });

        // Sidebar header
        expect(screen.getByText('СЕГМЕНТЫ')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        // Check active segment in list (by some distinctive style or just presence if hidden/visible is not testable easily)
        expect(screen.getByText('Segment 1')).toBeInTheDocument();
        expect(screen.getByText('Segment 2')).toBeInTheDocument();
        expect(screen.getByText('Segment 3')).toBeInTheDocument();
    });

    it('has a functional edit button leading to edit page', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({}, 1);
        const segment = segments[0];
        (api.getSegmentedVideo as any).mockResolvedValue(segmentedVideo);
        (api.getSegmentsByUuids as any).mockResolvedValue(segments);

        renderWithRouter(<SegmentPage />, {
            routePath: '/segmented-videos/:segmentedVideoId/segments/:segmentId',
            routerProps: { initialEntries: [`/segmented-videos/${segmentedVideo.uuid}/segments/${segments[0].uuid}`] }
        });

        await waitFor(() => screen.getByText('Редактировать'));

        const editBtn = screen.getByRole('link', { name: /Редактировать/i });
        expect(editBtn).toHaveAttribute('href', `/segmented-videos/${segmentedVideo.uuid}/segments/${segment.uuid}/edit`);
    });
});
