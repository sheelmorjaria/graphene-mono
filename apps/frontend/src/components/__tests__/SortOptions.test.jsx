import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import SortOptions from '../SortOptions';

describe('SortOptions', () => {
  const defaultProps = {
    currentSort: 'newest',
    onSortChange: vi.fn()
  };

  it('should render sort dropdown with label', () => {
    render(<SortOptions {...defaultProps} />);
    
    expect(screen.getByText('Sort by:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should display current sort option correctly', () => {
    render(<SortOptions {...defaultProps} currentSort="price-low" />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('price-low');
  });

  it('should render all sort options', () => {
    render(<SortOptions {...defaultProps} />);
    
    const select = screen.getByRole('combobox');
    const options = Array.from(select.querySelectorAll('option'));
    
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('Newest First');
    expect(options[0]).toHaveValue('newest');
    expect(options[1]).toHaveTextContent('Price: Low to High');
    expect(options[1]).toHaveValue('price-low');
    expect(options[2]).toHaveTextContent('Price: High to Low');
    expect(options[2]).toHaveValue('price-high');
    expect(options[3]).toHaveTextContent('Name A-Z');
    expect(options[3]).toHaveValue('name-asc');
  });

  it('should call onSortChange when selection changes', async () => {
    const user = userEvent.setup();
    const mockOnSortChange = vi.fn();
    
    render(<SortOptions {...defaultProps} onSortChange={mockOnSortChange} />);
    
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'price-low');
    
    expect(mockOnSortChange).toHaveBeenCalledWith('price-low');
  });

  it('should be accessible with proper labels', () => {
    render(<SortOptions {...defaultProps} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-label', 'Sort products');
  });

  it('should have responsive design styling', () => {
    const { container } = render(<SortOptions {...defaultProps} />);
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex', 'items-center', 'space-x-2');
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('border-gray-300', 'rounded-md', 'text-sm');
  });

  it('should handle focus and keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(<SortOptions {...defaultProps} />);
    
    const select = screen.getByRole('combobox');
    await user.tab();
    
    expect(select).toHaveFocus();
  });

  it('should maintain focus styles for accessibility', () => {
    render(<SortOptions {...defaultProps} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('focus:ring-2', 'focus:ring-blue-500', 'focus:border-blue-500');
  });
});