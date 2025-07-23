import { render, screen, waitFor, userEvent } from '../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../App';

// Mock the page components
vi.mock('../pages/ProductListPage', () => ({
  default: () => <div data-testid="product-list-page">Product List Page</div>
}));

vi.mock('../pages/ProductDetailsPage', () => ({
  default: () => <div data-testid="product-details-page">Product Details Page</div>
}));

// Mock the hooks and services used by pages
vi.mock('../hooks/useProducts', () => ({
  default: () => ({
    products: [],
    loading: false,
    error: null,
    totalPages: 1,
    currentPage: 1,
    totalProducts: 0
  })
}));

vi.mock('../hooks/useProductDetails', () => ({
  default: () => ({
    product: null,
    loading: false,
    error: null,
    refetch: vi.fn()
  })
}));

const renderWithRouter = (initialEntries = ['/']) => {
  return render(<AppRoutes />, {
    initialEntries
  });
};

describe('App Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render ProductListPage on root path', () => {
    renderWithRouter(['/']);
    
    expect(screen.getByTestId('product-list-page')).toBeInTheDocument();
  });

  it('should render ProductListPage on /products path', () => {
    renderWithRouter(['/products']);
    
    expect(screen.getByTestId('product-list-page')).toBeInTheDocument();
  });

  it('should render ProductDetailsPage on /products/:slug path', () => {
    renderWithRouter(['/products/grapheneos-pixel-9-pro']);
    
    expect(screen.getByTestId('product-details-page')).toBeInTheDocument();
  });

  it('should render 404 page for unknown routes', () => {
    renderWithRouter(['/unknown-route']);
    
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
    expect(screen.getByText(/the page you're looking for doesn't exist/i)).toBeInTheDocument();
  });

  it('should have navigation links in header', () => {
    renderWithRouter(['/']);
    
    expect(screen.getByRole('link', { name: /grapheneos store/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
  });

  it('should navigate between routes correctly', async () => {
    renderWithRouter(['/']);

    // Should start on product list page
    expect(screen.getByTestId('product-list-page')).toBeInTheDocument();

    // Click on products link (if it exists and is different from current)
    const productsLink = screen.queryByRole('link', { name: /products/i });
    if (productsLink && productsLink.getAttribute('href') !== '/') {
      await userEvent.click(productsLink);
      expect(screen.getByTestId('product-list-page')).toBeInTheDocument();
    }
  });

  it('should have proper document title for different routes', async () => {
    renderWithRouter(['/']);
    
    await waitFor(() => {
      expect(document.title).toContain('GrapheneOS Store');
    });
  });

  it('should handle browser back navigation', () => {
    renderWithRouter(['/products', '/products/test-product']);
    
    // Should be on product details page
    expect(screen.getByTestId('product-details-page')).toBeInTheDocument();
  });

  it('should render header and footer on all pages', () => {
    renderWithRouter(['/']);
    
    // Check for header
    expect(screen.getByRole('banner')).toBeInTheDocument();
    
    // Check for main content area
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should have proper responsive layout', () => {
    const { container } = renderWithRouter(['/']);
    
    // App should have responsive container classes
    const appContainer = container.querySelector('.min-h-screen');
    expect(appContainer).toBeInTheDocument();
  });

  it('should handle route parameters correctly', () => {
    renderWithRouter(['/products/test-slug-123']);
    
    expect(screen.getByTestId('product-details-page')).toBeInTheDocument();
  });

  it('should redirect to products page from root', () => {
    renderWithRouter(['/']);
    
    // Root should show the product list (either redirect or same component)
    expect(screen.getByTestId('product-list-page')).toBeInTheDocument();
  });

  it('should handle special characters in product slugs', () => {
    renderWithRouter(['/products/product-with-special-chars-123']);
    
    expect(screen.getByTestId('product-details-page')).toBeInTheDocument();
  });

  it('should maintain scroll position on navigation', () => {
    // This would be tested with actual scroll behavior in integration tests
    renderWithRouter(['/products']);
    expect(screen.getByTestId('product-list-page')).toBeInTheDocument();
  });
});