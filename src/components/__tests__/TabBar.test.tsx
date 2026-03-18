import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TabBar from '../TabBar';

describe('TabBar', () => {
    it('renders "Видео" and "Добавить" links', () => {
        render(<TabBar />, { wrapper: MemoryRouter });
        expect(screen.getAllByText('Видео')).toHaveLength(2); // Mobile + Desktop
        expect(screen.getAllByText('Добавить')).toHaveLength(2);
    });

    it('"Видео" link leads to /segmented-videos', () => {
        render(<TabBar />, { wrapper: MemoryRouter });
        const videoLinks = screen.getAllByRole('link', { name: /Видео/i });
        videoLinks.forEach(link => {
            expect(link).toHaveAttribute('href', '/segmented-videos');
        });
    });

    it('"Добавить" link leads to /segmented-videos/new', () => {
        render(<TabBar />, { wrapper: MemoryRouter });
        const addLinks = screen.getAllByRole('link', { name: /Добавить/i });
        addLinks.forEach(link => {
            expect(link).toHaveAttribute('href', '/segmented-videos/new');
        });
    });

    it('active link receives correct aria-current attribute', () => {
        render(
            <MemoryRouter initialEntries={['/segmented-videos']}>
                <TabBar />
            </MemoryRouter>
        );
        const videoLinks = screen.getAllByRole('link', { name: /Видео/i });
        videoLinks.forEach(link => {
            expect(link).toHaveAttribute('aria-current', 'page');
        });

        const addLinks = screen.getAllByRole('link', { name: /Добавить/i });
        addLinks.forEach(link => {
            expect(link).not.toHaveAttribute('aria-current', 'page');
        });
    });

    it('renders logo text "Spark ✦" in desktop sidebar', () => {
        render(<TabBar />, { wrapper: MemoryRouter });
        expect(screen.getByText('Spark ✦')).toBeInTheDocument();
    });

    it('renders theme toggle in desktop sidebar', () => {
        render(<TabBar />, { wrapper: MemoryRouter });
        expect(screen.getByText(/Тема/i)).toBeInTheDocument();
        expect(screen.getByRole('switch')).toBeInTheDocument();
    });
});
