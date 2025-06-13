import { render, screen, userEvent } from '../../test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import Pagination from '../Pagination';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    totalItems: 50,
    itemsPerPage: 12,
    onPageChange: vi.fn()
  };

  it('should render pagination with correct page numbers', () => {
    render(<Pagination {...defaultProps} />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    // For 5 pages with currentPage=1, algorithm shows: 1, 2, 3, ..., 5
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('should highlight current page', () => {
    render(<Pagination {...defaultProps} currentPage={3} />);
    
    const currentPageButton = screen.getByText('3');
    expect(currentPageButton).toHaveClass('bg-blue-600', 'text-white');
  });

  it('should show Previous and Next buttons', () => {
    render(<Pagination {...defaultProps} currentPage={3} />);
    
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('should disable Previous button on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />);
    
    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();
  });

  it('should disable Next button on last page', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('should call onPageChange when page number is clicked', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();
    
    render(<Pagination {...defaultProps} onPageChange={mockOnPageChange} />);
    
    await user.click(screen.getByText('3'));
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('should call onPageChange when Previous button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();
    
    render(<Pagination {...defaultProps} currentPage={3} onPageChange={mockOnPageChange} />);
    
    await user.click(screen.getByText('Previous'));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('should call onPageChange when Next button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnPageChange = vi.fn();
    
    render(<Pagination {...defaultProps} currentPage={2} onPageChange={mockOnPageChange} />);
    
    await user.click(screen.getByText('Next'));
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('should show ellipsis for large page counts', () => {
    render(<Pagination {...defaultProps} currentPage={1} totalPages={20} />);
    
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('should show correct page range around current page', () => {
    render(<Pagination {...defaultProps} currentPage={10} totalPages={20} />);
    
    // Should show: 1 ... 8 9 10 11 12 ... 20
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getAllByText('...')).toHaveLength(2);
  });

  it('should display items count information', () => {
    render(<Pagination {...defaultProps} currentPage={2} />);
    
    expect(screen.getByText('Showing 13-24 of 50 results')).toBeInTheDocument();
  });

  it('should handle single page correctly by not rendering', () => {
    const { container } = render(<Pagination {...defaultProps} totalPages={1} totalItems={5} />);
    
    // Component should not render for single page (returns null)
    expect(container.firstChild).toBeNull();
  });

  it('should be accessible with proper ARIA labels', () => {
    render(<Pagination {...defaultProps} currentPage={3} />);
    
    expect(screen.getByLabelText('Pagination Navigation')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 3, current page')).toBeInTheDocument();
  });

  it('should not render when totalPages is 0 or 1', () => {
    const { container: container1 } = render(<Pagination {...defaultProps} totalPages={0} />);
    expect(container1.firstChild).toBeNull();

    const { container: container2 } = render(<Pagination {...defaultProps} totalPages={1} />);
    expect(container2.firstChild).toBeNull();
  });

  it('should handle edge case for last page items display', () => {
    render(<Pagination {...defaultProps} currentPage={4} totalItems={47} itemsPerPage={12} totalPages={4} />);
    
    // Last page: items 37-47 of 47 results
    expect(screen.getByText('Showing 37-47 of 47 results')).toBeInTheDocument();
  });

  it('should be responsive with proper mobile styling', () => {
    const { container } = render(<Pagination {...defaultProps} />);
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('flex', 'flex-col', 'sm:flex-row');
  });
});