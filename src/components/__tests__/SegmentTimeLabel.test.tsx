import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SegmentTimeLabel } from '../SegmentTimeLabel';

vi.mock('@/utils/time', () => ({
    parseTime: vi.fn((t: string) => (t === '0:30' ? 30 : t === '1:30' ? 90 : 0)),
    formatTime: vi.fn((s: number) => (s === 30 ? '0:30' : s === 90 ? '1:30' : '0:00')),
}));

describe('SegmentTimeLabel', () => {
    it('renders only start time when timeEnd is missing', () => {
        render(<SegmentTimeLabel timeStart="0:30" />);
        expect(screen.getByText('0:30')).toBeInTheDocument();
    });

    it('renders range when timeEnd is provided', () => {
        render(<SegmentTimeLabel timeStart="0:30" timeEnd="1:30" />);
        expect(screen.getByText(/0:30 – 1:30/i)).toBeInTheDocument();
    });

    it('renders correctly in compact variant', () => {
        render(<SegmentTimeLabel timeStart="0:30" variant="compact" />);
        expect(screen.getByText('0:30')).toBeInTheDocument();
    });

    it('renders Scissors icon in full variant', () => {
        render(<SegmentTimeLabel timeStart="0:30" variant="full" />);
        expect(screen.getByTestId('scissors-icon')).toBeInTheDocument();
    });

    it('does not render Scissors icon in compact variant', () => {
        render(<SegmentTimeLabel timeStart="0:30" variant="compact" />);
        expect(screen.queryByTestId('scissors-icon')).not.toBeInTheDocument();
    });
});
