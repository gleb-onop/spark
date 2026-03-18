import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SelectSheet } from '../SelectSheet';

// Mock Drawer components
vi.mock('../ui/drawer', () => ({
    Drawer: ({ children }: any) => <div data-testid="mock-drawer">{children}</div>,
    DrawerTrigger: ({ children }: any) => <div data-testid="mock-trigger">{children}</div>,
    DrawerContent: ({ children }: any) => <div data-testid="mock-content">{children}</div>,
    DrawerHeader: ({ children }: any) => <div>{children}</div>,
    DrawerTitle: ({ children }: any) => <div>{children}</div>,
    // DrawerClose needs to be a clickable element or proxy clicks to children
    DrawerClose: ({ children }: any) => <div data-testid="mock-close">{children}</div>,
}));

describe('SelectSheet', () => {
    const makeDefaultProps = () => ({
        items: [
            { id: '1', label: 'Item 1' },
            { id: '2', label: 'Item 2' },
        ],
        value: '',
        onChange: vi.fn(),
        placeholder: 'Select item',
        title: 'Choose one',
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders placeholder when value not selected', () => {
        render(<SelectSheet {...makeDefaultProps()} />);
        expect(screen.getByText('Select item')).toBeInTheDocument();
    });

    it('renders label of selected item in trigger', () => {
        render(<SelectSheet {...makeDefaultProps()} value="1" />);
        const trigger = screen.getByTestId('mock-trigger');
        expect(within(trigger).getByText('Item 1')).toBeInTheDocument();
    });

    it('renders all items in drawer content', () => {
        render(<SelectSheet {...makeDefaultProps()} />);
        const content = screen.getByTestId('mock-content');
        expect(within(content).getByText('Item 1')).toBeInTheDocument();
        expect(within(content).getByText('Item 2')).toBeInTheDocument();
    });

    it('clicking an item calls onChange with correct id', () => {
        const props = makeDefaultProps();
        render(<SelectSheet {...props} />);
        const content = screen.getByTestId('mock-content');
        // In our mock, the Button (from SelectSheet) is the one having the onClick
        fireEvent.click(within(content).getByText('Item 2'));
        expect(props.onChange).toHaveBeenCalledWith('2');
    });

    it('selected item displays Check icon', () => {
        render(<SelectSheet {...makeDefaultProps()} value="1" />);
        const content = screen.getByTestId('mock-content');
        const item1Btn = within(content).getByText('Item 1').closest('button');
        expect(item1Btn?.querySelector('.lucide-check')).toBeInTheDocument();

        const item2Btn = within(content).getByText('Item 2').closest('button');
        expect(item2Btn?.querySelector('.lucide-check')).not.toBeInTheDocument();
    });
});
