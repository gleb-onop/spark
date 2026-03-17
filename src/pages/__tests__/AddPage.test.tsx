import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddPage from '../AddPage';
import { renderWithRouter, createSegmentedVideo } from '../../test/helpers';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
    api: {
        getSegmentedVideos: vi.fn(),
        addSegment: vi.fn(),
        addSegmentedVideoWithSegment: vi.fn(),
    }
}));

describe('AddPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders "New Collection" mode by default', async () => {
        (api.getSegmentedVideos as any).mockResolvedValue([]);
        renderWithRouter(<AddPage />);

        expect(screen.getByText('Новое сегментированное видео')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Мои любимые клипы/i)).toBeInTheDocument();
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
        renderWithRouter(<AddPage />);
        await waitFor(() => expect(api.getSegmentedVideos).toHaveBeenCalled());

        // Set name
        const nameInput = screen.getByPlaceholderText(/Мои любимые клипы/i);
        fireEvent.change(nameInput, { target: { value: 'Test' } });

        // Set valid link to trigger metadata (mocked debounce)
        const urlInput = screen.getByPlaceholderText(/Вставьте ссылку/i);
        fireEvent.change(urlInput, { target: { value: 'dQw4w9WgXcQ' } });

        await act(async () => {
            await new Promise(r => setTimeout(r, 600)); // wait for debounce without fake timers
        });

        // Set invalid times (end < start)
        const startInput = screen.getByLabelText(/Старт/i);
        const endInput = screen.getByLabelText(/Конец/i);

        fireEvent.change(startInput, { target: { value: '0:10.000' } });
        fireEvent.change(endInput, { target: { value: '0:05.000' } });
        fireEvent.blur(startInput);
        fireEvent.blur(endInput);

        const saveBtn = screen.getByRole('button', { name: /Сохранить/i });
        fireEvent.click(saveBtn);

        expect(await screen.findByText(/Конец должен быть позже начала/i)).toBeInTheDocument();
    });

    it('shows validation error for short duration', async () => {
        (api.getSegmentedVideos as any).mockResolvedValue([]);
        renderWithRouter(<AddPage />);

        fireEvent.change(screen.getByPlaceholderText(/Мои любимые клипы/i), { target: { value: 'Test' } });
        fireEvent.change(screen.getByPlaceholderText(/Вставьте ссылку/i), { target: { value: 'dQw4w9WgXcQ' } });

        await act(async () => {
            await new Promise(r => setTimeout(r, 600));
        });

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

        renderWithRouter(<AddPage />);

        fireEvent.change(screen.getByPlaceholderText(/Мои любимые клипы/i), { target: { value: 'My New Collection' } });
        fireEvent.change(screen.getByPlaceholderText(/Вставьте ссылку/i), { target: { value: 'dQw4w9WgXcQ' } });

        await act(async () => {
            await new Promise(r => setTimeout(r, 600));
        });

        // Times should be default or we can set them
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
