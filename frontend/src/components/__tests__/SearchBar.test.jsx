import { render, screen, fireEvent, userEvent } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchBar from '../SearchBar';

const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input with placeholder text', () => {
    render(<SearchBar />);
    
    const searchInput = screen.getByPlaceholderText(/search products/i);
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('type', 'text');
  });

  it('should render search button with search icon', () => {
    render(<SearchBar />);
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    expect(searchButton).toBeInTheDocument();
    expect(searchButton).toHaveAttribute('type', 'submit');
  });

  it('should handle text input changes', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByPlaceholderText(/search products/i);
    
    await user.type(searchInput, 'pixel phone');
    
    expect(searchInput).toHaveValue('pixel phone');
  });

  it('should navigate to search page on form submission', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByPlaceholderText(/search products/i);
    const searchForm = searchInput.closest('form');
    
    await user.type(searchInput, 'pixel');
    fireEvent.submit(searchForm);
    
    expect(mockNavigate).toHaveBeenCalledWith('/search?q=pixel');
  });

  it('should navigate to search page when search button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByPlaceholderText(/search products/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    await user.type(searchInput, 'smartphone');
    await user.click(searchButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/search?q=smartphone');
  });

  it('should handle Enter key press to submit search', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByPlaceholderText(/search products/i);
    
    await user.type(searchInput, 'graphene');
    await user.keyboard('{Enter}');
    
    expect(mockNavigate).toHaveBeenCalledWith('/search?q=graphene');
  });

  it('should not submit empty search', async () => {
    render(<SearchBar />);
    
    const searchInput = screen.getByPlaceholderText(/search products/i);
    const searchForm = searchInput.closest('form');
    
    // Try to submit with empty input
    fireEvent.submit(searchForm);
    
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should not submit whitespace-only search', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByPlaceholderText(/search products/i);
    const searchForm = searchInput.closest('form');
    
    await user.type(searchInput, '   ');
    fireEvent.submit(searchForm);
    
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should clear input when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByPlaceholderText(/search products/i);
    
    await user.type(searchInput, 'test query');
    expect(searchInput).toHaveValue('test query');
    
    // Clear button should appear when there's text
    const clearButton = screen.getByRole('button', { name: /clear search/i });
    expect(clearButton).toBeInTheDocument();
    
    await user.click(clearButton);
    expect(searchInput).toHaveValue('');
  });

  it('should not show clear button when input is empty', () => {
    render(<SearchBar />);
    
    const clearButton = screen.queryByRole('button', { name: /clear search/i });
    expect(clearButton).not.toBeInTheDocument();
  });

  it('should URL encode search query properly', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByPlaceholderText(/search products/i);
    const searchForm = searchInput.closest('form');
    
    await user.type(searchInput, 'pixel & smartphone');
    fireEvent.submit(searchForm);
    
    expect(mockNavigate).toHaveBeenCalledWith('/search?q=pixel%20%26%20smartphone');
  });

  it('should focus input when search button container is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByPlaceholderText(/search products/i);
    const searchContainer = searchInput.closest('[data-testid="search-bar"]');
    
    expect(searchInput).not.toHaveFocus();
    
    await user.click(searchContainer);
    
    expect(searchInput).toHaveFocus();
  });

  it('should have proper accessibility attributes', () => {
    render(<SearchBar />);
    
    const searchInput = screen.getByPlaceholderText(/search products/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    expect(searchInput).toHaveAttribute('aria-label', 'Search products');
    expect(searchButton).toHaveAttribute('aria-label', 'Search');
    
    // Form should have proper role
    const form = searchInput.closest('form');
    expect(form).toHaveAttribute('role', 'search');
  });

  it('should be responsive with proper CSS classes', () => {
    const { container } = render(<SearchBar />);
    
    const searchBar = container.querySelector('[data-testid="search-bar"]');
    expect(searchBar).toHaveClass('relative', 'flex', 'items-center');
    
    const searchInput = screen.getByPlaceholderText(/search products/i);
    expect(searchInput).toHaveClass('w-full', 'px-4', 'py-2');
  });

  it('should support custom className prop', () => {
    const customClass = 'custom-search-bar';
    const { container } = render(<SearchBar className={customClass} />);
    
    const searchBar = container.querySelector('[data-testid="search-bar"]');
    expect(searchBar).toHaveClass(customClass);
  });

  it('should support custom placeholder prop', () => {
    const customPlaceholder = 'Find your perfect device...';
    render(<SearchBar placeholder={customPlaceholder} />);
    
    const searchInput = screen.getByPlaceholderText(customPlaceholder);
    expect(searchInput).toBeInTheDocument();
  });

  it('should handle rapid successive inputs without issues', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByPlaceholderText(/search products/i);
    
    // Rapidly type and delete text
    await user.type(searchInput, 'a');
    await user.clear(searchInput);
    await user.type(searchInput, 'pixel');
    await user.clear(searchInput);
    await user.type(searchInput, 'smartphone');
    
    expect(searchInput).toHaveValue('smartphone');
  });

  it('should maintain focus after clearing input', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByPlaceholderText(/search products/i);
    
    await user.type(searchInput, 'test');
    const clearButton = screen.getByRole('button', { name: /clear search/i });
    await user.click(clearButton);
    
    expect(searchInput).toHaveFocus();
    expect(searchInput).toHaveValue('');
  });

  it('should handle keyboard navigation properly', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByPlaceholderText(/search products/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    // Tab to search input
    await user.tab();
    expect(searchInput).toHaveFocus();
    
    // Tab to search button
    await user.tab();
    expect(searchButton).toHaveFocus();
  });
});