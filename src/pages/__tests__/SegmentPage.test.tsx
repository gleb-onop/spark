import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SegmentPage from '../SegmentPage';
import { renderWithRouter, createSegmentedVideo } from '../../test/helpers';

// Mock ALL hooks used in SegmentPage
vi.mock('../../hooks/useSegmentedVideo', () => ({
    useSegmentedVideo: vi.fn(),
}));

vi.mock('../../hooks/useYouTubePlayer', () => ({
    useYouTubePlayer: vi.fn().mockReturnValue({ playerRef: { current: null } }),
}));

vi.mock('../../hooks/useProgressSync', () => ({
    useProgressSync: vi.fn().mockReturnValue({ progressPct: 0, seek: vi.fn() }),
}));

vi.mock('../../hooks/useLoopSetting', () => ({
    useLoopSetting: vi.fn().mockReturnValue({ isLooping: false, toggleLoop: vi.fn() }),
}));

vi.mock('../../hooks/useSegmentNavigation', () => ({
    useSegmentNavigation: vi.fn().mockReturnValue({ onComplete: vi.fn() }),
}));

vi.mock('../../hooks/useControlsVisibility', () => ({
    useControlsVisibility: vi.fn().mockReturnValue({ showControls: true, resetTimer: vi.fn() }),
}));

vi.mock('../../hooks/useOrientationFullscreen', () => ({
    useOrientationFullscreen: vi.fn(),
}));

// Mock sub-components
vi.mock('../../components/SegmentsProgressBar', () => ({
    SegmentsProgressBar: () => <div data-testid="mock-progress-bar" />
}));

vi.mock('../../components/SegmentThumbnail', () => ({
    SegmentThumbnail: ({ title }: { title: string }) => <img alt={title || 'Segment Thumbnail'} />
}));

vi.mock('../../components/ExpandableDescription', () => ({
    ExpandableDescription: ({ text }: { text: string }) => <div>{text || 'Нет описания'}</div>
}));

import { useSegmentedVideo } from '../../hooks/useSegmentedVideo';
import { useLoopSetting } from '../../hooks/useLoopSetting';

describe('SegmentPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const setupMocks = (segmentedVideo: any, segments: any[], isLooping = false) => {
        (useSegmentedVideo as any).mockReturnValue({
            isLoading: false,
            segmentedVideo,
            segments
        });
        (useLoopSetting as any).mockReturnValue({
            isLooping,
            toggleLoop: vi.fn()
        });
    };

    it('renders collection title and segment info', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({ name: 'Learning React' }, 1);
        const segment = segments[0];
        setupMocks(segmentedVideo, segments);

        renderWithRouter(<SegmentPage />, {
            routePath: '/segmented-videos/:segmentedVideoId/segments/:segmentId',
            routerProps: {
                initialEntries: [`/segmented-videos/${segmentedVideo.uuid}/segments/${segment.uuid}`]
            }
        });

        expect(screen.getAllByText(/Learning React/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(segment.description).length).toBeGreaterThan(0);

        expect(screen.getAllByText(/0:30\.000/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/1:45\.000/).length).toBeGreaterThan(0);
    });

    it('handles empty description', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({}, 1);
        segments[0].description = '';
        segments[0].video.description = '';
        setupMocks(segmentedVideo, segments);

        renderWithRouter(<SegmentPage />, {
            routePath: '/segmented-videos/:segmentedVideoId/segments/:segmentId',
            routerProps: { initialEntries: [`/segmented-videos/${segmentedVideo.uuid}/segments/${segments[0].uuid}`] }
        });

        expect(screen.getByText(/Нет описания/i)).toBeInTheDocument();
    });

    it('shows loop toggle with correct text', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({}, 1);
        setupMocks(segmentedVideo, segments, true);

        renderWithRouter(<SegmentPage />, {
            routePath: '/segmented-videos/:segmentedVideoId/segments/:segmentId',
            routerProps: { initialEntries: [`/segmented-videos/${segmentedVideo.uuid}/segments/${segments[0].uuid}`] }
        });

        expect(screen.getByText(/Зациклить сегментированное видео/i)).toBeInTheDocument();
        expect(screen.getByText(/Авто-повтор текущего списка/i)).toBeInTheDocument();

        // Target the specific switch by its accessible name
        const loopSwitch = screen.getByRole('switch', { name: /Зациклить сегментированное видео/i });
        expect(loopSwitch).toBeChecked();
    });

    it('renders segment list sidebar on desktop', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({ name: 'Course' }, 3);
        setupMocks(segmentedVideo, segments);

        renderWithRouter(<SegmentPage />, {
            routePath: '/segmented-videos/:segmentedVideoId/segments/:segmentId',
            routerProps: { initialEntries: [`/segmented-videos/${segmentedVideo.uuid}/segments/${segments[0].uuid}`] }
        });

        expect(screen.getAllByText(/Course/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Сегменты/i)).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        expect(screen.getAllByText('Segment 1').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Segment 2').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Segment 3').length).toBeGreaterThan(0);
    });

    it('has functional edit buttons', async () => {
        const { segmentedVideo, segments } = createSegmentedVideo({}, 1);
        const segment = segments[0];
        setupMocks(segmentedVideo, segments);

        renderWithRouter(<SegmentPage />, {
            routePath: '/segmented-videos/:segmentedVideoId/segments/:segmentId',
            routerProps: { initialEntries: [`/segmented-videos/${segmentedVideo.uuid}/segments/${segments[0].uuid}`] }
        });

        const editLinks = screen.getAllByRole('link').filter(l => l.getAttribute('href')?.includes('/edit'));
        expect(editLinks.length).toBeGreaterThan(0);
        expect(editLinks[0]).toHaveAttribute('href', `/segmented-videos/${segmentedVideo.uuid}/segments/${segment.uuid}/edit`);
    });
});
