import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import SearchResultsPage from '../SearchResultsPage';

// Mock the useSearch hook
vi.mock('../../hooks/useSearch', () => ({
  default: vi.fn()
}));

import useSearch from '../../hooks/useSearch';

// Mock ProductCard component
vi.mock('../../components/ProductCard', () => ({
  default: ({ product }) => (
    <div data-testid="product-card">
      <h3>{product.name}</h3>
      <p>{product.price}</p>
    </div>
  )
}));

// Mock SearchBar component
vi.mock('../../components/SearchBar', () => ({
  default: ({ onSearch }) => (
    <div data-testid="search-bar">
      <input 
        data-testid="search-input"
        placeholder="Search products..."
        onChange={(e) => onSearch && onSearch(e.target.value)}
      />
    </div>
  )
}));

const mockSearchResults = {
  products: [
    {
      id: '1',
      name: 'GrapheneOS Pixel 9 Pro',
      slug: 'grapheneos-pixel-9-pro',
      price: 899.99,
      images: ['image1.jpg'],
      condition: 'new',
      stockStatus: 'in_stock',
      category: { name: 'Smartphones' }
    },
    {
      id: '2',
      name: 'GrapheneOS Pixel 9',
      slug: 'grapheneos-pixel-9',
      price: 799.99,
      images: ['image2.jpg'],
      condition: 'new',
      stockStatus: 'in_stock',
      category: { name: 'Smartphones' }
    }
  ],
  totalProducts: 2,
  totalPages: 1,
  currentPage: 1
};

const renderWithRouter = (component, initialRoute = '/search?q=pixel') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {component}
    </MemoryRouter>
  );
};

describe('SearchResultsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render search page with results', async () => {
    useSearch.mockReturnValue({
      searchResults: mockSearchResults,
      loading: false,
      error: null,
      performSearch: vi.fn()
    });

    renderWithRouter(<SearchResultsPage />);

    expect(screen.getByText('Search Results')).toBeInTheDocument();
    expect(screen.getByText('Found 2 products for "pixel"')).toBeInTheDocument();
    
    const productCards = screen.getAllByTestId('product-card');
    expect(productCards).toHaveLength(2);
    
    expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    expect(screen.getByText('GrapheneOS Pixel 9')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    useSearch.mockReturnValue({
      searchResults: null,
      loading: true,
      error: null,
      performSearch: vi.fn()
    });

    renderWithRouter(<SearchResultsPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText(/searching products/i)).toBeInTheDocument();
  });

  it('should display error state', () => {
    useSearch.mockReturnValue({
      searchResults: null,
      loading: false,
      error: 'Failed to search products',
      performSearch: vi.fn()
    });

    renderWithRouter(<SearchResultsPage />);

    expect(screen.getByText(/error searching products/i)).toBeInTheDocument();
    expect(screen.getByText('Failed to search products')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('should display no results state', () => {
    useSearch.mockReturnValue({
      searchResults: {
        products: [],
        totalProducts: 0,
        totalPages: 0,
        currentPage: 1
      },
      loading: false,
      error: null,
      performSearch: vi.fn()
    });

    renderWithRouter(<SearchResultsPage />);

    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
    expect(screen.getByText(/try searching for different keywords/i)).toBeInTheDocument();
  });

  it('should handle search from search bar', async () => {
    const mockPerformSearch = vi.fn();
    useSearch.mockReturnValue({
      searchResults: mockSearchResults,
      loading: false,
      error: null,
      performSearch: mockPerformSearch
    });

    const user = userEvent.setup();
    renderWithRouter(<SearchResultsPage />);

    const searchInput = screen.getByTestId('search-input');
    
    // Clear the field first and then type
    await user.clear(searchInput);
    await user.type(searchInput, 'smartphone');

    // The component will trigger a search with the new query via URL change
    // Multiple calls will happen as the user types, the final one should be for 'smartphone'
    expect(mockPerformSearch).toHaveBeenCalledWith('smartphone', { page: 1 });
  });

  it('should retry search when retry button is clicked', async () => {
    const mockPerformSearch = vi.fn();
    useSearch.mockReturnValue({
      searchResults: null,
      loading: false,
      error: 'Network error',
      performSearch: mockPerformSearch
    });

    const user = userEvent.setup();
    renderWithRouter(<SearchResultsPage />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    // The retry should call with the current page parameter
    expect(mockPerformSearch).toHaveBeenCalledWith('pixel', { page: 1 });
  });

  it('should display pagination when multiple pages exist', () => {
    const multiPageResults = {
      ...mockSearchResults,
      totalProducts: 25,
      totalPages: 3,
      currentPage: 1
    };

    useSearch.mockReturnValue({
      searchResults: multiPageResults,
      loading: false,
      error: null,
      performSearch: vi.fn()
    });

    renderWithRouter(<SearchResultsPage />);

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
  });

  it('should handle pagination navigation', async () => {
    const mockPerformSearch = vi.fn();
    const multiPageResults = {
      ...mockSearchResults,
      totalProducts: 25,
      totalPages: 3,
      currentPage: 1
    };

    useSearch.mockReturnValue({
      searchResults: multiPageResults,
      loading: false,
      error: null,
      performSearch: mockPerformSearch
    });

    const user = userEvent.setup();
    renderWithRouter(<SearchResultsPage />);

    const nextButton = screen.getByRole('button', { name: /next page/i });
    await user.click(nextButton);

    expect(mockPerformSearch).toHaveBeenCalledWith('pixel', { page: 2 });
  });

  it('should display sorting options', () => {
    useSearch.mockReturnValue({
      searchResults: mockSearchResults,
      loading: false,
      error: null,
      performSearch: vi.fn()
    });

    renderWithRouter(<SearchResultsPage />);

    expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
    expect(screen.getByText(/relevance/i)).toBeInTheDocument();
    expect(screen.getByText(/price: low to high/i)).toBeInTheDocument();
    expect(screen.getByText(/price: high to low/i)).toBeInTheDocument();
  });

  it('should handle sorting change', async () => {
    const mockPerformSearch = vi.fn();
    useSearch.mockReturnValue({
      searchResults: mockSearchResults,
      loading: false,
      error: null,
      performSearch: mockPerformSearch
    });

    const user = userEvent.setup();
    renderWithRouter(<SearchResultsPage />);

    const sortSelect = screen.getByLabelText(/sort by/i);
    await user.selectOptions(sortSelect, 'price-asc');

    expect(mockPerformSearch).toHaveBeenCalledWith('pixel', { 
      page: 1,
      sortBy: 'price',
      sortOrder: 'asc'
    });
  });

  it('should extract search query from URL params', () => {
    useSearch.mockReturnValue({
      searchResults: mockSearchResults,
      loading: false,
      error: null,
      performSearch: vi.fn()
    });

    renderWithRouter(<SearchResultsPage />, '/search?q=smartphone%20case');

    expect(screen.getByText('Found 2 products for "smartphone case"')).toBeInTheDocument();
  });

  it('should handle empty search query in URL', () => {
    useSearch.mockReturnValue({
      searchResults: null,
      loading: false,
      error: null,
      performSearch: vi.fn()
    });

    renderWithRouter(<SearchResultsPage />, '/search');

    expect(screen.getByText(/enter a search term/i)).toBeInTheDocument();
  });

  it('should update document title with search query', () => {
    useSearch.mockReturnValue({
      searchResults: mockSearchResults,
      loading: false,
      error: null,
      performSearch: vi.fn()
    });

    renderWithRouter(<SearchResultsPage />);

    expect(document.title).toContain('Search: pixel');
  });

  it('should display filter options', () => {
    useSearch.mockReturnValue({
      searchResults: mockSearchResults,
      loading: false,
      error: null,
      performSearch: vi.fn()
    });

    renderWithRouter(<SearchResultsPage />);

    expect(screen.getByText(/filters/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/condition/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/min price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max price/i)).toBeInTheDocument();
  });

  it('should handle filter changes', async () => {
    const mockPerformSearch = vi.fn();
    useSearch.mockReturnValue({
      searchResults: mockSearchResults,
      loading: false,
      error: null,
      performSearch: mockPerformSearch
    });

    const user = userEvent.setup();
    renderWithRouter(<SearchResultsPage />);

    const conditionSelect = screen.getByLabelText(/condition/i);
    await user.selectOptions(conditionSelect, 'new');

    expect(mockPerformSearch).toHaveBeenCalledWith('pixel', { 
      page: 1,
      condition: 'new'
    });
  });

  it('should be responsive with proper CSS classes', () => {
    useSearch.mockReturnValue({
      searchResults: mockSearchResults,
      loading: false,
      error: null,
      performSearch: vi.fn()
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/search?q=pixel']}>
        <SearchResultsPage />
      </MemoryRouter>
    );

    const mainContainer = container.querySelector('[data-testid="search-results-page"]');
    expect(mainContainer).toHaveClass('container', 'mx-auto', 'px-4');
  });

  it('should handle keyboard navigation for pagination', async () => {
    const mockPerformSearch = vi.fn();
    const multiPageResults = {
      ...mockSearchResults,
      totalProducts: 25,
      totalPages: 3,
      currentPage: 2
    };

    useSearch.mockReturnValue({
      searchResults: multiPageResults,
      loading: false,
      error: null,
      performSearch: mockPerformSearch
    });

    const user = userEvent.setup();
    renderWithRouter(<SearchResultsPage />);

    const _prevButton = screen.getByRole('button', { name: /previous page/i });
    await user.tab(); // Focus on prev button
    await user.keyboard('{Enter}');

    expect(mockPerformSearch).toHaveBeenCalledWith('pixel', { page: 1 });
  });

  it('should maintain search state when navigating pages', () => {
    const mockPerformSearch = vi.fn();
    useSearch.mockReturnValue({
      searchResults: mockSearchResults,
      loading: false,
      error: null,
      performSearch: mockPerformSearch
    });

    renderWithRouter(<SearchResultsPage />, '/search?q=pixel&page=2&sortBy=price');

    // Should call performSearch with existing URL params (sortBy gets extracted from URL)
    expect(mockPerformSearch).toHaveBeenCalledWith('pixel', expect.objectContaining({
      page: 2
    }));
  });
});