import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { useTheme } from '../../hooks/use-theme';

// Mock useNavigate correctly by mocking the whole module
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../../hooks/use-theme', () => ({
    useTheme: vi.fn(),
}));

describe('PageHeader', () => {
    const makeDefaultProps = () => ({
        title: 'Header Title',
    });

    beforeEach(() => {
        vi.clearAllMocks();
        (useTheme as any).mockReturnValue({
            theme: 'light',
            toggleTheme: vi.fn(),
        });
    });

    it('renders title', () => {
        render(<PageHeader {...makeDefaultProps()} />, { wrapper: MemoryRouter });
        expect(screen.getByText('Header Title')).toBeInTheDocument();
    });

    it('renders back button when backPath is provided', () => {
        render(<PageHeader {...makeDefaultProps()} backPath="/back" />, { wrapper: MemoryRouter });
        expect(screen.getByRole('button', { name: /назад/i })).toBeInTheDocument();
    });

    it('does not render back button when backPath is not provided', () => {
        render(<PageHeader {...makeDefaultProps()} />, { wrapper: MemoryRouter });
        expect(screen.queryByRole('button', { name: /назад/i })).not.toBeInTheDocument();
    });

    it('calls navigate with correct argument when back button clicked', () => {
        render(<PageHeader {...makeDefaultProps()} backPath="/target-path" />, { wrapper: MemoryRouter });
        const backBtn = screen.getByRole('button', { name: /назад/i });
        fireEvent.click(backBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/target-path');
    });

    it('shows Sun icon when theme is light', () => {
        (useTheme as any).mockReturnValue({
            theme: 'light',
            toggleTheme: vi.fn(),
        });
        render(<PageHeader {...makeDefaultProps()} />, { wrapper: MemoryRouter });
        expect(screen.getByLabelText('Светлая тема')).toBeInTheDocument();
        expect(screen.queryByLabelText('Тёмная тема')).not.toBeInTheDocument();
    });

    it('shows Moon icon when theme is dark', () => {
        (useTheme as any).mockReturnValue({
            theme: 'dark',
            toggleTheme: vi.fn(),
        });
        render(<PageHeader {...makeDefaultProps()} />, { wrapper: MemoryRouter });
        expect(screen.getByLabelText('Тёмная тема')).toBeInTheDocument();
        expect(screen.queryByLabelText('Светлая тема')).not.toBeInTheDocument();
    });

    it('calls toggleTheme when switch clicked', () => {
        const toggleTheme = vi.fn();
        (useTheme as any).mockReturnValue({
            theme: 'light',
            toggleTheme,
        });
        render(<PageHeader {...makeDefaultProps()} />, { wrapper: MemoryRouter });

        const switchEl = screen.getByRole('switch');
        fireEvent.click(switchEl);
        expect(toggleTheme).toHaveBeenCalled();
    });

    it('renders actions content when provided', () => {
        render(
            <PageHeader
                {...makeDefaultProps()}
                actions={<button data-testid="action-btn">Action</button>}
            />,
            { wrapper: MemoryRouter }
        );
        expect(screen.getByTestId('action-btn')).toBeInTheDocument();
    });
});
