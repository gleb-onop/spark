import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExpandableDescription } from '../ExpandableDescription';

describe('ExpandableDescription', () => {
    it('renders "Нет описания" when text is empty string', () => {
        render(<ExpandableDescription text="" />);
        expect(screen.getByText('Нет описания')).toBeInTheDocument();
        // and no expand button
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders text when provided', () => {
        render(<ExpandableDescription text="Hello World" />);
        expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('does not show "Развернуть" button when text length is below threshold', () => {
        render(<ExpandableDescription text="Short text" threshold={20} />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows "Развернуть" button when text is longer than threshold', () => {
        const longText = 'This is a very long text that should definitely be longer than the threshold we are setting here.'.repeat(2);
        render(<ExpandableDescription text={longText} threshold={50} />);
        expect(screen.getByRole('button', { name: /развернуть/i })).toBeInTheDocument();
    });

    it('clicking "Развернуть" changes button text to "Свернуть"', () => {
        const longText = 'A longer text than 20 chars'.repeat(5);
        render(<ExpandableDescription text={longText} threshold={20} />);
        const button = screen.getByRole('button', { name: /развернуть/i });
        fireEvent.click(button);
        expect(screen.getByRole('button', { name: /свернуть/i })).toBeInTheDocument();
    });

    it('clicking "Свернуть" changes button text back to "Развернуть"', () => {
        const longText = 'A longer text than 20 chars'.repeat(5);
        render(<ExpandableDescription text={longText} threshold={20} />);
        const button = screen.getByRole('button', { name: /развернуть/i });
        fireEvent.click(button); // Expand
        fireEvent.click(screen.getByRole('button', { name: /свернуть/i })); // Collapse
        expect(screen.getByRole('button', { name: /развернуть/i })).toBeInTheDocument();
    });
});
