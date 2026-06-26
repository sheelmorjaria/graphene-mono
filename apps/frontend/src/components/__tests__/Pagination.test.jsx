import { render, screen, within, userEvent } from '../../test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import Pagination from '../Pagination';

// Helper: the page-number buttons live inside the desktop-only container
// (`.hidden.sm:flex`). The mobile indicator renders the current page number a
// second time, so unscoped getByText matches multiple nodes. Scope to the
// desktop page-number wrapper to keep queries unique.
const getPageNumbersContainer = () => {
  const desktopWrappers = document.querySelectorAll('div.hidden.sm\\:flex, div[class*="hidden sm:flex"]');
  if (desktopWrappers.length) return desktopWrappers[desktopWrappers.length - 1];
  // Fallback: locate by the page-number buttons themselves
  return document.querySelector('nav');
};

// The "Showing X-Y of Z results" text is split across nested <span>s in the
// component, so a plain getByText(fullString) fails. Match on the wrapping
// span's full textContent instead.
const findShowingText = (container, expected) => {
  const spans = container.querySelectorAll('span');
  return Array.from(spans).find((s) => s.textContent === expected);
};

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

    const pageContainer = getPageNumbersContainer();
    expect(within(pageContainer).getByText('1')).toBeInTheDocument();
    expect(within(pageContainer).getByText('2')).toBeInTheDocument();
    expect(within(pageContainer).getByText('3')).toBeInTheDocument();
    expect(within(pageContainer).getByText('5')).toBeInTheDocument();
    // For 5 pages with currentPage=1, algorithm shows: 1, 2, 3, ..., 5
    expect(within(pageContainer).getByText('...')).toBeInTheDocument();
  });

  it('should highlight current page', () => {
    render(<Pagination {...defaultProps} currentPage={3} />);

    const pageContainer = getPageNumbersContainer();
    const currentPageButton = within(pageContainer).getByText('3');
    expect(currentPageButton).toHaveClass('bg-gradient-to-r', 'text-text-on-accent');
  });

  it('should show Previous and Next buttons', () => {
    render(<Pagination {...defaultProps} currentPage={3} />);

    expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
  });

  it('should disable Previous button on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />);

    const prevButton = screen.getByLabelText('Go to previous page');
    expect(prevButton).toBeDisabled();
  });

  it('should disable Next button on last page', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);

    const nextButton = screen.getByLabelText('Go to next page');
    expect(nextButton).toBeDisabled();
  });

  it('should call onPageChange when page number is clicked', async () => {
    const mockOnPageChange = vi.fn();

    render(<Pagination {...defaultProps} onPageChange={mockOnPageChange} />);

    const pageContainer = getPageNumbersContainer();
    await userEvent.click(within(pageContainer).getByText('3'));
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('should call onPageChange when Previous button is clicked', async () => {
    const mockOnPageChange = vi.fn();

    render(<Pagination {...defaultProps} currentPage={3} onPageChange={mockOnPageChange} />);

    await userEvent.click(screen.getByLabelText('Go to previous page'));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('should call onPageChange when Next button is clicked', async () => {
    const mockOnPageChange = vi.fn();

    render(<Pagination {...defaultProps} currentPage={2} onPageChange={mockOnPageChange} />);

    await userEvent.click(screen.getByLabelText('Go to next page'));
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('should show ellipsis for large page counts', () => {
    const { container } = render(<Pagination {...defaultProps} currentPage={1} totalPages={20} />);

    const pageContainer = getPageNumbersContainer();
    expect(within(pageContainer).getByText('...')).toBeInTheDocument();
    expect(container).toBeTruthy();
  });

  it('should show correct page range around current page', () => {
    render(<Pagination {...defaultProps} currentPage={10} totalPages={20} />);

    const pageContainer = getPageNumbersContainer();
    // Should show: 1 ... 8 9 10 11 12 ... 20
    expect(within(pageContainer).getByText('1')).toBeInTheDocument();
    expect(within(pageContainer).getByText('8')).toBeInTheDocument();
    expect(within(pageContainer).getByText('9')).toBeInTheDocument();
    expect(within(pageContainer).getByText('10')).toBeInTheDocument();
    expect(within(pageContainer).getByText('11')).toBeInTheDocument();
    expect(within(pageContainer).getByText('12')).toBeInTheDocument();
    expect(within(pageContainer).getByText('20')).toBeInTheDocument();
    expect(within(pageContainer).getAllByText('...')).toHaveLength(2);
  });

  it('should display items count information', () => {
    const { container } = render(<Pagination {...defaultProps} currentPage={2} />);

    expect(findShowingText(container, 'Showing 13-24 of 50 results')).toBeDefined();
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
    const { container } = render(
      <Pagination {...defaultProps} currentPage={4} totalItems={47} itemsPerPage={12} totalPages={4} />
    );

    // Last page: items 37-47 of 47 results
    expect(findShowingText(container, 'Showing 37-47 of 47 results')).toBeDefined();
  });

  it('should be responsive with proper mobile styling', () => {
    const { container } = render(<Pagination {...defaultProps} />);

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('flex', 'flex-col', 'sm:flex-row');
  });
});
