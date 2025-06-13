import { render, screen, waitFor } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductListPage from '../ProductListPage';

// Mock the useProducts hook
vi.mock('../../hooks/useProducts', () => ({
  default: vi.fn()
}));

// Mock the ProductCard component
vi.mock('../../components/ProductCard', () => ({
  default: ({ product }) => (
    <div data-testid="product-card">
      <h3>{product.name}</h3>
      <p>£{product.price.toFixed(2)}</p>
    </div>
  )
}));

// Mock the Pagination component
vi.mock('../../components/Pagination', () => ({
  default: ({ currentPage, totalPages, onPageChange }) => {
    // Don't render pagination if there's only one page or no pages (mimic real component)
    if (totalPages <= 1) {
      return null;
    }
    
    return (
      <div data-testid="pagination">
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => onPageChange(currentPage + 1)}>Next</button>
      </div>
    );
  }
}));

// Mock the SortOptions component
vi.mock('../../components/SortOptions', () => ({
  default: ({ currentSort, onSortChange }) => (
    <div data-testid="sort-options">
      <select value={currentSort} onChange={(e) => onSortChange(e.target.value)}>
        <option value="newest">Newest First</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
        <option value="name-asc">Name A-Z</option>
      </select>
    </div>
  )
}));

// Mock the FilterSidebar component
vi.mock('../../components/FilterSidebar', () => ({
  default: ({ selectedCategory, selectedCondition, priceRange, onCategoryChange, onConditionChange, onPriceRangeChange, onClearFilters }) => (
    <div data-testid="filter-sidebar">
      <select value={selectedCategory} onChange={(e) => onCategoryChange(e.target.value)}>
        <option value="">All Categories</option>
        <option value="smartphones">Smartphones</option>
        <option value="accessories">Accessories</option>
      </select>
      <select value={selectedCondition} onChange={(e) => onConditionChange(e.target.value)}>
        <option value="">All Conditions</option>
        <option value="new">New</option>
        <option value="excellent">Excellent</option>
      </select>
      <input 
        placeholder="Min price" 
        value={priceRange.min} 
        onChange={(e) => onPriceRangeChange({ ...priceRange, min: e.target.value })} 
      />
      <input 
        placeholder="Max price" 
        value={priceRange.max} 
        onChange={(e) => onPriceRangeChange({ ...priceRange, max: e.target.value })} 
      />
      <button onClick={onClearFilters}>Clear Filters</button>
    </div>
  )
}));

import useProducts from '../../hooks/useProducts';

const mockProducts = [
  {
    id: '1',
    name: 'GrapheneOS Pixel 9 Pro',
    slug: 'grapheneos-pixel-9-pro',
    shortDescription: 'Privacy-focused smartphone with GrapheneOS',
    price: 899.99,
    images: ['https://example.com/pixel9pro.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: { id: 'cat1', name: 'Smartphones', slug: 'smartphones' },
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'GrapheneOS Pixel 9',
    slug: 'grapheneos-pixel-9',
    shortDescription: 'Privacy-focused smartphone with GrapheneOS',
    price: 799.99,
    images: ['https://example.com/pixel9.jpg'],
    condition: 'excellent',
    stockStatus: 'in_stock',
    category: { id: 'cat1', name: 'Smartphones', slug: 'smartphones' },
    createdAt: '2024-01-15T10:30:00Z'
  }
];

describe('ProductListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title and products grid', () => {
    useProducts.mockReturnValue({
      products: mockProducts,
      pagination: { page: 1, limit: 12, total: 2, pages: 1 },
      loading: false,
      error: null,
      fetchProducts: vi.fn()
    });

    render(<ProductListPage />);

    expect(screen.getByText('GrapheneOS Smartphones')).toBeInTheDocument();
    expect(screen.getByText('Privacy-focused smartphones with GrapheneOS pre-installed')).toBeInTheDocument();
    expect(screen.getAllByTestId('product-card')).toHaveLength(2);
    // Pagination should not render for single page
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    // Sort options should always be visible
    expect(screen.getByTestId('sort-options')).toBeInTheDocument();
    // Filter sidebar should always be visible
    expect(screen.getByTestId('filter-sidebar')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    useProducts.mockReturnValue({
      products: [],
      pagination: { page: 1, limit: 12, total: 0, pages: 0 },
      loading: true,
      error: null,
      fetchProducts: vi.fn()
    });

    render(<ProductListPage />);

    expect(screen.getByText('Loading products...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should show error state', () => {
    useProducts.mockReturnValue({
      products: [],
      pagination: { page: 1, limit: 12, total: 0, pages: 0 },
      loading: false,
      error: 'Failed to fetch products',
      fetchProducts: vi.fn()
    });

    render(<ProductListPage />);

    expect(screen.getByText('Error loading products')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch products')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should show empty state when no products found', () => {
    useProducts.mockReturnValue({
      products: [],
      pagination: { page: 1, limit: 12, total: 0, pages: 0 },
      loading: false,
      error: null,
      fetchProducts: vi.fn()
    });

    render(<ProductListPage />);

    expect(screen.getByText('No products found')).toBeInTheDocument();
    expect(screen.getByText('We couldn\'t find any products matching your criteria.')).toBeInTheDocument();
  });

  it('should call fetchProducts on mount', () => {
    const mockFetchProducts = vi.fn();
    useProducts.mockReturnValue({
      products: [],
      pagination: { page: 1, limit: 12, total: 0, pages: 0 },
      loading: false,
      error: null,
      fetchProducts: mockFetchProducts
    });

    render(<ProductListPage />);

    expect(mockFetchProducts).toHaveBeenCalledTimes(1);
    expect(mockFetchProducts).toHaveBeenCalledWith({ sort: 'newest' });
  });

  it('should have responsive grid layout', () => {
    useProducts.mockReturnValue({
      products: mockProducts,
      pagination: { page: 1, limit: 12, total: 2, pages: 1 },
      loading: false,
      error: null,
      fetchProducts: vi.fn()
    });

    const { container } = render(<ProductListPage />);

    const grid = container.querySelector('.products-grid');
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid).toHaveClass('md:grid-cols-3');
    expect(grid).toHaveClass('gap-6');
  });

  it('should render products count correctly', () => {
    useProducts.mockReturnValue({
      products: mockProducts,
      pagination: { page: 1, limit: 12, total: 25, pages: 3 },
      loading: false,
      error: null,
      fetchProducts: vi.fn()
    });

    render(<ProductListPage />);

    expect(screen.getByText('25 products found')).toBeInTheDocument();
  });

  it('should handle plural/singular products count text', () => {
    useProducts.mockReturnValue({
      products: [mockProducts[0]],
      pagination: { page: 1, limit: 12, total: 1, pages: 1 },
      loading: false,
      error: null,
      fetchProducts: vi.fn()
    });

    render(<ProductListPage />);

    expect(screen.getByText('1 product found')).toBeInTheDocument();
  });

  it('should have proper semantic structure', () => {
    useProducts.mockReturnValue({
      products: mockProducts,
      pagination: { page: 1, limit: 12, total: 2, pages: 1 },
      loading: false,
      error: null,
      fetchProducts: vi.fn()
    });

    render(<ProductListPage />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('GrapheneOS Smartphones');
  });

  it('should retry fetching products when Try Again is clicked', async () => {
    const mockFetchProducts = vi.fn();
    useProducts.mockReturnValue({
      products: [],
      pagination: { page: 1, limit: 12, total: 0, pages: 0 },
      loading: false,
      error: 'Network error',
      fetchProducts: mockFetchProducts
    });

    render(<ProductListPage />);

    const tryAgainButton = screen.getByText('Try Again');
    tryAgainButton.click();

    expect(mockFetchProducts).toHaveBeenCalledTimes(2); // Once on mount, once on retry
    expect(mockFetchProducts).toHaveBeenCalledWith({ sort: 'newest' });
  });

  it('should be accessible with proper ARIA labels', () => {
    useProducts.mockReturnValue({
      products: mockProducts,
      pagination: { page: 1, limit: 12, total: 2, pages: 1 },
      loading: false,
      error: null,
      fetchProducts: vi.fn()
    });

    render(<ProductListPage />);

    expect(screen.getByLabelText('Product listings')).toBeInTheDocument();
  });

  it('should display correctly on mobile and desktop', () => {
    useProducts.mockReturnValue({
      products: mockProducts,
      pagination: { page: 1, limit: 12, total: 2, pages: 1 },
      loading: false,
      error: null,
      fetchProducts: vi.fn()
    });

    const { container } = render(<ProductListPage />);
    
    const mainContainer = container.querySelector('main');
    expect(mainContainer).toHaveClass('container', 'mx-auto', 'px-4', 'py-8');
  });

  it('should render pagination when there are multiple pages', () => {
    const mockFetchProducts = vi.fn();
    useProducts.mockReturnValue({
      products: mockProducts,
      pagination: { page: 1, limit: 12, total: 25, pages: 3 },
      loading: false,
      error: null,
      fetchProducts: mockFetchProducts
    });

    render(<ProductListPage />);

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('should call fetchProducts with page parameter when page changes', () => {
    const mockFetchProducts = vi.fn();
    useProducts.mockReturnValue({
      products: mockProducts,
      pagination: { page: 1, limit: 12, total: 25, pages: 3 },
      loading: false,
      error: null,
      fetchProducts: mockFetchProducts
    });

    render(<ProductListPage />);

    const nextButton = screen.getByText('Next');
    nextButton.click();

    expect(mockFetchProducts).toHaveBeenCalledWith({ page: 2, sort: 'newest' });
  });

  it('should call fetchProducts with sort parameter when sort changes', () => {
    const mockFetchProducts = vi.fn();
    useProducts.mockReturnValue({
      products: mockProducts,
      pagination: { page: 1, limit: 12, total: 25, pages: 3 },
      loading: false,
      error: null,
      fetchProducts: mockFetchProducts
    });

    render(<ProductListPage />);

    // Find the sort select specifically in the sort-options component
    const sortOptions = screen.getByTestId('sort-options');
    const sortSelect = sortOptions.querySelector('select');
    sortSelect.value = 'price-low';
    sortSelect.dispatchEvent(new Event('change', { bubbles: true }));

    expect(mockFetchProducts).toHaveBeenCalledWith({ sort: 'price-low', page: 1 });
  });

  it('should show sort options with initial sort value', () => {
    useProducts.mockReturnValue({
      products: mockProducts,
      pagination: { page: 1, limit: 12, total: 2, pages: 1 },
      loading: false,
      error: null,
      fetchProducts: vi.fn()
    });

    render(<ProductListPage />);

    // Find the sort select specifically in the sort-options component
    const sortOptions = screen.getByTestId('sort-options');
    const sortSelect = sortOptions.querySelector('select');
    expect(sortSelect).toHaveValue('newest');
  });

  it('should call fetchProducts with filter parameters when filters change', () => {
    const mockFetchProducts = vi.fn();
    useProducts.mockReturnValue({
      products: mockProducts,
      pagination: { page: 1, limit: 12, total: 25, pages: 3 },
      loading: false,
      error: null,
      fetchProducts: mockFetchProducts
    });

    render(<ProductListPage />);

    // Find the category select specifically in the filter-sidebar component
    const filterSidebar = screen.getByTestId('filter-sidebar');
    const categorySelects = filterSidebar.querySelectorAll('select');
    const categorySelect = categorySelects[0]; // First select is category
    categorySelect.value = 'smartphones';
    categorySelect.dispatchEvent(new Event('change', { bubbles: true }));

    expect(mockFetchProducts).toHaveBeenCalledWith({
      sort: 'newest',
      category: 'smartphones'
    });
  });

  it('should render filter sidebar with correct props', () => {
    useProducts.mockReturnValue({
      products: mockProducts,
      pagination: { page: 1, limit: 12, total: 2, pages: 1 },
      loading: false,
      error: null,
      fetchProducts: vi.fn()
    });

    render(<ProductListPage />);

    expect(screen.getByTestId('filter-sidebar')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min price')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Max price')).toBeInTheDocument();
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('should have responsive layout with sidebar', () => {
    const { container } = render(<ProductListPage />);
    
    const mainLayout = container.querySelector('.flex.flex-col.lg\\:flex-row');
    expect(mainLayout).toBeInTheDocument();
    
    const sidebar = container.querySelector('.lg\\:w-1\\/4');
    expect(sidebar).toBeInTheDocument();
    
    const content = container.querySelector('.lg\\:w-3\\/4');
    expect(content).toBeInTheDocument();
  });
});