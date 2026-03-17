import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, Routes, Route, type MemoryRouterProps } from 'react-router-dom';
import type { ReactElement } from 'react';
import type { SegmentedVideo, Segment, Video } from '../types';

// --- Render with Router ---

interface RenderWithRouterOptions extends Omit<RenderOptions, 'wrapper'> {
    routerProps?: MemoryRouterProps;
    routePath?: string;
}

export const renderWithRouter = (
    ui: ReactElement,
    { routerProps, routePath = '*', ...renderOptions }: RenderWithRouterOptions = {}
) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter {...routerProps}>
            <Routes>
                <Route path={routePath} element={children} />
            </Routes>
        </MemoryRouter>
    );
    return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// --- Test Data Factories ---

let counter = 0;

export const createVideo = (overrides: Partial<Video> = {}): Video => ({
    uuid: `video-${++counter}`,
    youtubeId: 'dQw4w9WgXcQ',
    description: '',
    duration: 120,
    isEmbeddable: true,
    isVertical: false,
    createdAt: Date.now(),
    ...overrides,
});

export const createSegment = (overrides: Partial<Segment> = {}): Segment => ({
    uuid: `segment-${++counter}`,
    description: 'Test segment description',
    timeStart: '0:30.000',
    timeEnd: '1:45.000',
    video: createVideo(),
    createdAt: Date.now(),
    ...overrides,
});

export const createSegmentedVideo = (
    overrides: Partial<SegmentedVideo> = {},
    segmentCount = 0
): { segmentedVideo: SegmentedVideo; segments: Segment[] } => {
    const segments = Array.from({ length: segmentCount }, (_, i) =>
        createSegment({ description: `Segment ${i + 1}` })
    );

    const segmentedVideo: SegmentedVideo = {
        uuid: `sv-${++counter}`,
        name: 'Приветствия на английском',
        createdAt: Date.now(),
        segmentIds: segments.map(s => s.uuid),
        ...overrides,
    };

    return { segmentedVideo, segments };
};

// --- Storage Helpers ---

const SEGMENTED_VIDEOS_KEY = 'spark_segmented_videos';
const SEGMENTS_KEY = 'spark_segments';

export const seedStorage = (
    segmentedVideos: SegmentedVideo[],
    segments: Segment[]
) => {
    localStorage.setItem(SEGMENTED_VIDEOS_KEY, JSON.stringify(segmentedVideos));
    localStorage.setItem(SEGMENTS_KEY, JSON.stringify(segments));
};
