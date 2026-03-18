import { screen, waitFor } from '@testing-library/react';
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

// Mock components to avoid deep dependencies and network/timers
vi.mock('../../components/SegmentsProgressBar', () => ({
    SegmentsProgressBar: () => <div data-testid="mock-progress-bar" />
}));

vi.mock('../../components/SegmentThumbnail', () => ({
    SegmentThumbnail: ({ title }: { title: string }) => <img alt={title} />
}));

vi.mock('../../components/ExpandableDescription', () => ({
    ExpandableDescription: ({ text }: { text: string }) => <div>{text || 'Нет описания'}</div>
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
            routePath: '/segmented-videos/:segmentedVideoId/segments/:segmentId',
            routerProps: {
                initialEntries: [`/segmented-videos/${segmentedVideo.uuid}/segments/${segment.uuid}`]
            }
        });

        // Spec: Заголовок коллекции - отображается название
        await waitFor(() => {
            expect(screen.getAllByText(/Learning React/i).length).toBeGreaterThan(0);
        });

        // Spec: Описание сегмента
        expect(screen.getAllByText(segment.description).length).toBeGreaterThan(0);

        // Spec: Временные метки (с миллисекундами)
        // en-dash (U+2013) is used in the component
        expect(screen.getByText(/0:30\.000.*1:45\.000/)).toBeInTheDocument();
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
            expect(screen.getByText(/Зациклить сегментированное видео/i)).toBeInTheDocument();
            expect(screen.getByText(/Авто-повтор текущего списка/i)).toBeInTheDocument();
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
            expect(screen.getAllByText(/Course/i).length).toBeGreaterThan(0);
        });

        // Sidebar header
        expect(screen.getByText(/Сегменты/i)).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        // Check active segment in list
        expect(screen.getAllByText('Segment 1').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Segment 2').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Segment 3').length).toBeGreaterThan(0);
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

        await waitFor(() => {
            // There are multiple ways to edit (mobile header, desktop button)
            // We just need to check the link exists and is correct
            const editLinks = screen.getAllByRole('link').filter(l => l.getAttribute('href')?.includes('/edit'));
            expect(editLinks.length).toBeGreaterThan(0);
            expect(editLinks[0]).toHaveAttribute('href', `/segmented-videos/${segmentedVideo.uuid}/segments/${segment.uuid}/edit`);
        });
    });
});
