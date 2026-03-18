import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditPage from '../EditPage';
import { renderWithRouter, createSegment } from '../../test/helpers';
import { useEditSegment } from '../../hooks/useEditSegment';

// Better typed mocks for sub-components
vi.mock('../../components/UpdatePages/YouTubeInputSection', () => ({
    YouTubeInputSection: ({ youtubeId, timeStart, setTimeStart, timeEnd, setTimeEnd }: any) => (
        <div data-testid="mock-youtube-input">
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

vi.mock('../../components/UpdatePages/SegmentDescription', () => ({
    SegmentDescription: ({ description, setDescription }: any) => (
        <div data-testid="mock-segment-description">
            <label htmlFor="description">Описание</label>
            <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
        </div>
    )
}));

vi.mock('../../hooks/useEditSegment', () => ({
    useEditSegment: vi.fn(),
}));

describe('EditPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders "Edit" header and pre-fills fields', async () => {
        const segment = createSegment({
            description: 'Original desc',
            timeStart: '0:10.000',
            timeEnd: '0:20.000'
        });

        (useEditSegment as any).mockReturnValue({
            state: {
                isLoading: false,
                isSaving: false,
                youtubeId: 'abc',
                description: 'Original desc',
                timeStart: '0:10.000',
                timeEnd: '0:20.000',
                duration: 100,
                error: ''
            },
            actions: {
                handleSave: vi.fn(),
                handleDurationReady: vi.fn(),
                setDescription: vi.fn(),
                setTimeStart: vi.fn(),
                setTimeEnd: vi.fn()
            }
        });

        renderWithRouter(<EditPage />, {
            routePath: '/segmented-videos/:segmentedVideoId/segments/:segmentId/edit',
            routerProps: { initialEntries: [`/segmented-videos/sv1/segments/${segment.uuid}/edit`] }
        });

        expect(screen.getByText('Редактировать')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Original desc')).toBeInTheDocument();
        expect(screen.getByDisplayValue('0:10.000')).toBeInTheDocument();
        expect(screen.getByDisplayValue('0:20.000')).toBeInTheDocument();
    });

    it('handles saving updates', async () => {
        const handleSave = vi.fn();
        const setDescription = vi.fn();

        (useEditSegment as any).mockReturnValue({
            state: {
                isLoading: false,
                isSaving: false,
                youtubeId: 'abc',
                description: 'Original desc',
                timeStart: '0:10.000',
                timeEnd: '0:20.000',
                duration: 100,
                error: ''
            },
            actions: {
                handleSave,
                handleDurationReady: vi.fn(),
                setDescription,
                setTimeStart: vi.fn(),
                setTimeEnd: vi.fn()
            }
        });

        renderWithRouter(<EditPage />, {
            routePath: '/segmented-videos/:segmentedVideoId/segments/:segmentId/edit',
            routerProps: { initialEntries: ['/segmented-videos/sv1/segments/s1/edit'] }
        });

        // Change description
        const descInput = screen.getByLabelText(/Описание/i);
        fireEvent.change(descInput, { target: { value: 'Updated description' } });
        expect(setDescription).toHaveBeenCalledWith('Updated description');

        // Save
        fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));
        expect(handleSave).toHaveBeenCalled();
    });

    it('shows error message if present in state', async () => {
        (useEditSegment as any).mockReturnValue({
            state: {
                isLoading: false,
                isSaving: false,
                youtubeId: 'abc',
                description: 'desc',
                timeStart: '0:10.000',
                timeEnd: '0:20.000',
                duration: 100,
                error: 'Validation failed'
            },
            actions: {
                handleSave: vi.fn(),
                handleDurationReady: vi.fn(),
                setDescription: vi.fn(),
                setTimeStart: vi.fn(),
                setTimeEnd: vi.fn()
            }
        });

        renderWithRouter(<EditPage />, {
            routePath: '/segmented-videos/:segmentedVideoId/segments/:segmentId/edit',
            routerProps: { initialEntries: ['/segmented-videos/sv1/segments/s1/edit'] }
        });

        expect(screen.getByText(/Validation failed/i)).toBeInTheDocument();
    });
});
