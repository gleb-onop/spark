import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
    const makeDefaultProps = () => ({
        open: true,
        onOpenChange: vi.fn(),
        title: 'Test Title',
        primaryAction: {
            label: 'Confirm',
            onClick: vi.fn(),
        },
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders title and description when provided', () => {
        render(<ConfirmDialog {...makeDefaultProps()} description="Test Description" />);
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
        render(<ConfirmDialog {...makeDefaultProps()} />);
        expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
    });

    it('renders primary action button with correct text', () => {
        render(<ConfirmDialog {...makeDefaultProps()} />);
        const primaryBtn = screen.getByText('Confirm');
        expect(primaryBtn).toBeInTheDocument();
    });

    it('renders secondary action button when provided', () => {
        const props = makeDefaultProps();
        const secondaryAction = {
            label: 'Cancel',
            onClick: vi.fn(),
        };
        render(<ConfirmDialog {...props} secondaryAction={secondaryAction} />);
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('hides secondary action button when not provided', () => {
        render(<ConfirmDialog {...makeDefaultProps()} />);
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('calls primaryAction.onClick when clicked', () => {
        const props = makeDefaultProps();
        render(<ConfirmDialog {...props} />);
        fireEvent.click(screen.getByText('Confirm'));
        expect(props.primaryAction.onClick).toHaveBeenCalledTimes(1);
    });

    it('calls secondaryAction.onClick when clicked', () => {
        const props = makeDefaultProps();
        const secondaryAction = {
            label: 'Cancel',
            onClick: vi.fn(),
        };
        render(<ConfirmDialog {...props} secondaryAction={secondaryAction} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(secondaryAction.onClick).toHaveBeenCalledTimes(1);
    });

    it('renders children when provided', () => {
        render(
            <ConfirmDialog {...makeDefaultProps()}>
                <div data-testid="child-content">Child Content</div>
            </ConfirmDialog>
        );
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
});
