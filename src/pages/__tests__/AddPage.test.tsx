import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddPage from '../AddPage';
import { renderWithRouter, createSegmentedVideo } from '../../test/helpers';
import { api } from '../../services/api';
import { useYouTubeMetadata } from '../../hooks/useYouTubeMetadata';

vi.mock('../../services/api', () => ({
    api: {
        getSegmentedVideos: vi.fn(),
        getSegments: vi.fn(),
        addSegment: vi.fn(),
        addSegmentedVideoWithSegment: vi.fn(),
    }
}));

vi.mock('../../hooks/useYouTubeMetadata', () => ({
    useYouTubeMetadata: vi.fn().mockReturnValue({
        youtubeId: '',
        initialTimestamp: null,
        urlError: ''
    })
}));

vi.mock('../../components/UpdatePages/YouTubeInputSection', () => ({
    YouTubeInputSection: ({ url, setUrl, urlError, youtubeId, timeStart, setTimeStart, timeEnd, setTimeEnd }: any) => (
        <div data-testid="mock-youtube-input">
            <label htmlFor="segment-url">Ссылка на YouTube</label>
            <input
                id="segment-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Вставьте ссылку..."
            />
            {urlError && <div>{urlError}</div>}
            {youtubeId && (
                <>
                    <label htmlFor="start">Старт</label>
                    <input id="start" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
                    <label htmlFor="end">Конец</label>
                    <input id="end" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
                </>
            )}
        </div>
    )
}));

describe('AddPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useYouTubeMetadata as any).mockReturnValue({
            youtubeId: '',
            initialTimestamp: null,
            urlError: ''
        });
    });

    it('renders "New Collection" mode by default', async () => {
        (api.getSegmentedVideos as any).mockResolvedValue([]);
        renderWithRouter(<AddPage />);

        expect(screen.getByText('Новое сегментированное видео')).toBeInTheDocument();
        const nameInput = screen.getByPlaceholderText(/Мои любимые клипы/i);
        expect(nameInput).toBeInTheDocument();
        expect((nameInput as HTMLInputElement).value).toMatch(/^untitled-/);
        await waitFor(() => expect(api.getSegmentedVideos).toHaveBeenCalled());
    });

    it('renders "Add Segment" mode if videoId is present', async () => {
        const { segmentedVideo } = createSegmentedVideo({ uuid: '123', name: 'Existing' });
        (api.getSegmentedVideos as any).mockResolvedValue([segmentedVideo]);

        renderWithRouter(<AddPage />, {
            routePath: '/segmented-videos/:segmentedVideoId/segments/new',
            routerProps: { initialEntries: ['/segmented-videos/123/segments/new'] }
        });

        await waitFor(() => {
            expect(screen.getByText('Добавить сегмент')).toBeInTheDocument();
        });
        expect(screen.queryByPlaceholderText(/Мои любимые клипы/i)).not.toBeInTheDocument();
    });

    it('shows validation error for empty link', async () => {
        (api.getSegmentedVideos as any).mockResolvedValue([]);
        renderWithRouter(<AddPage />);
        await waitFor(() => expect(api.getSegmentedVideos).toHaveBeenCalled());

        const saveBtn = screen.getByRole('button', { name: /Сохранить/i });
        fireEvent.click(saveBtn);

        expect(await screen.findByText(/Введите корректную ссылку на YouTube/i)).toBeInTheDocument();
    });

    it('shows validation error for invalid duration', async () => {
        (api.getSegmentedVideos as any).mockResolvedValue([]);
        (useYouTubeMetadata as any).mockReturnValue({
            youtubeId: 'dQw4w9WgXcQ',
            initialTimestamp: null,
            urlError: ''
        });

        renderWithRouter(<AddPage />);
        await waitFor(() => expect(api.getSegmentedVideos).toHaveBeenCalled());

        // Fill URL
        fireEvent.change(screen.getByPlaceholderText(/Вставьте ссылку/i), { target: { value: 'https://youtube.com/watch?v=dQw4w9WgXcQ' } });

        // Times should now be available
        const startInput = screen.getByLabelText(/Старт/i);
        const endInput = screen.getByLabelText(/Конец/i);

        fireEvent.change(startInput, { target: { value: '0:10.000' } });
        fireEvent.change(endInput, { target: { value: '0:05.000' } });
        fireEvent.blur(startInput);
        fireEvent.blur(endInput);

        fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));

        expect(await screen.findByText(/Конец должен быть позже начала/i)).toBeInTheDocument();
    });

    it('shows validation error for short duration', async () => {
        (api.getSegmentedVideos as any).mockResolvedValue([]);
        (useYouTubeMetadata as any).mockReturnValue({
            youtubeId: 'dQw4w9WgXcQ',
            initialTimestamp: null,
            urlError: ''
        });

        renderWithRouter(<AddPage />);

        fireEvent.change(screen.getByPlaceholderText(/Вставьте ссылку/i), { target: { value: 'https://youtube.com/watch?v=dQw4w9WgXcQ' } });

        const startInput = screen.getByLabelText(/Старт/i);
        const endInput = screen.getByLabelText(/Конец/i);

        fireEvent.change(startInput, { target: { value: '0:00.000' } });
        fireEvent.change(endInput, { target: { value: '0:01.000' } });
        fireEvent.blur(startInput);
        fireEvent.blur(endInput);

        fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));

        expect(await screen.findByText(/Минимальная длина отрезка — 2.5 сек/i)).toBeInTheDocument();
    });

    it('handles successful save in New Collection mode', async () => {
        (api.getSegmentedVideos as any).mockResolvedValue([]);
        (api.addSegmentedVideoWithSegment as any).mockResolvedValue({ segmentedVideo: {}, segment: {} });
        (useYouTubeMetadata as any).mockReturnValue({
            youtubeId: 'dQw4w9WgXcQ',
            initialTimestamp: null,
            urlError: ''
        });

        renderWithRouter(<AddPage />);

        fireEvent.change(screen.getByPlaceholderText(/Вставьте ссылку/i), { target: { value: 'https://youtube.com/watch?v=dQw4w9WgXcQ' } });
        fireEvent.change(screen.getByPlaceholderText(/Мои любимые клипы/i), { target: { value: 'My New Collection' } });

        fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));

        await waitFor(() => {
            expect(api.addSegmentedVideoWithSegment).toHaveBeenCalledWith(
                'My New Collection',
                expect.objectContaining({
                    video: expect.objectContaining({ youtubeId: 'dQw4w9WgXcQ' })
                })
            );
        });
    });
});
