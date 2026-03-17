import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditPage from '../EditPage';
import { renderWithRouter, createSegment } from '../../test/helpers';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
    api: {
        getSegment: vi.fn(),
        updateSegment: vi.fn(),
    }
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
        (api.getSegment as any).mockResolvedValue(segment);

        renderWithRouter(<EditPage />, {
            routePath: '/segmented-videos/:segmentedVideoId/segments/:segmentUuid/edit',
            routerProps: { initialEntries: [`/segmented-videos/sv1/segments/${segment.uuid}/edit`] }
        });

        expect(await screen.findByText('Редактировать')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByDisplayValue('Original desc')).toBeInTheDocument();
            expect(screen.getByDisplayValue('0:10.000')).toBeInTheDocument();
            expect(screen.getByDisplayValue('0:20.000')).toBeInTheDocument();
        });
    });

    it('handles validation and saving updates', async () => {
        const segment = createSegment();
        (api.getSegment as any).mockResolvedValue(segment);
        (api.updateSegment as any).mockResolvedValue(undefined);

        renderWithRouter(<EditPage />, {
            routePath: '/segmented-videos/:segmentedVideoId/segments/:segmentUuid/edit',
            routerProps: { initialEntries: [`/segmented-videos/sv1/segments/${segment.uuid}/edit`] }
        });

        await waitFor(() => screen.getByDisplayValue(segment.description));

        // Change description
        const descInput = screen.getByLabelText(/Описание/i);
        fireEvent.change(descInput, { target: { value: 'Updated description' } });

        // Save
        fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));

        await waitFor(() => {
            expect(api.updateSegment).toHaveBeenCalledWith(
                segment.uuid,
                expect.objectContaining({
                    description: 'Updated description'
                })
            );
        });
    });

    it('shows validation error if end is before start during edit', async () => {
        const segment = createSegment();
        (api.getSegment as any).mockResolvedValue(segment);

        renderWithRouter(<EditPage />, {
            routePath: '/segmented-videos/:segmentedVideoId/segments/:segmentUuid/edit',
            routerProps: { initialEntries: [`/segmented-videos/sv1/segments/${segment.uuid}/edit`] }
        });

        await waitFor(() => screen.getByDisplayValue(segment.description));

        const startInput = screen.getByLabelText(/Старт/i);
        const endInput = screen.getByLabelText(/Конец/i);

        fireEvent.change(startInput, { target: { value: '0:30.000' } });
        fireEvent.change(endInput, { target: { value: '0:20.000' } });
        fireEvent.blur(startInput);
        fireEvent.blur(endInput);

        fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));

        expect(await screen.findByText(/Конец должен быть позже начала/i)).toBeInTheDocument();
    });
});
