import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { EmptyState } from '../EmptyState';
import { Search } from 'lucide-react';

describe('EmptyState', () => {
    const defaultProps = {
        icon: <Search data-testid="search-icon" />,
        title: 'Empty Title',
        description: 'Empty Description',
    };

    it('renders icon, title, and description', () => {
        render(<EmptyState {...defaultProps} />, { wrapper: MemoryRouter });
        expect(screen.getByTestId('search-icon')).toBeInTheDocument();
        expect(screen.getByText('Empty Title')).toBeInTheDocument();
        expect(screen.getByText('Empty Description')).toBeInTheDocument();
    });

    it('renders action button and link when actionLabel and actionTo are provided', () => {
        render(<EmptyState {...defaultProps} actionLabel="Add Item" actionTo="/add" />, { wrapper: MemoryRouter });
        const link = screen.getByRole('link', { name: /Add Item/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/add');
    });

    it('does not render button when actionLabel or actionTo are missing', () => {
        const { rerender } = render(<EmptyState {...defaultProps} actionLabel="Add Item" />, { wrapper: MemoryRouter });
        expect(screen.queryByRole('link')).not.toBeInTheDocument();

        rerender(<EmptyState {...defaultProps} actionTo="/add" />);
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('button leads to the correct path from actionTo', () => {
        render(<EmptyState {...defaultProps} actionLabel="Add Item" actionTo="/custom-path" />, { wrapper: MemoryRouter });
        expect(screen.getByRole('link')).toHaveAttribute('href', '/custom-path');
    });
});
