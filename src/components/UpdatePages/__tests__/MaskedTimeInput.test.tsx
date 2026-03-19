import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MaskedTimeInput } from '../MaskedTimeInput';

describe('MaskedTimeInput', () => {
    it('disables hours if duration is less than 1 hour', () => {
        const dummyOnChange = vi.fn();
        render(<MaskedTimeInput value="0:00:00.000" onChange={dummyOnChange} duration={3599} />);

        const inputs = screen.getAllByPlaceholderText('00') as HTMLInputElement[];
        const hhInput = inputs[0];
        // The first input with '00' placeholder is hours
        expect(hhInput).toBeDisabled();
        expect(hhInput.value).toBe('00');
    });

    it('disables minutes if duration is less than 1 minute', () => {
        const dummyOnChange = vi.fn();
        render(<MaskedTimeInput value="0:00:00.000" onChange={dummyOnChange} duration={59} />);

        const inputs = screen.getAllByPlaceholderText('00') as HTMLInputElement[];
        const hhInput = inputs[0];
        const mmInput = inputs[1];

        expect(hhInput).toBeDisabled();
        expect(mmInput).toBeDisabled();
    });

    it('enables all fields if duration is large', () => {
        const dummyOnChange = vi.fn();
        render(<MaskedTimeInput value="1:23:45.678" onChange={dummyOnChange} duration={4000} />);

        const inputs = screen.getAllByPlaceholderText('00') as HTMLInputElement[];
        const hhInput = inputs[0];
        const mmInput = inputs[1];
        const ssInput = inputs[2];

        expect(hhInput).not.toBeDisabled();
        expect(mmInput).not.toBeDisabled();
        expect(ssInput).not.toBeDisabled();
    });
});
