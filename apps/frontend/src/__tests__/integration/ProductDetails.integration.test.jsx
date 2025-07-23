import { render, screen, waitFor, userEvent } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppRoutes } from '../../App';

// Mock fetch globally for integration tests
global.fetch = vi.fn();

// Mock the hooks that ProductListPage depends on
vi.mock('../../hooks/useProducts', () => ({
  default: vi.fn(() => ({
    products: [],
    loading: false,
    error: null,
    totalPages: 1,
    currentPage: 1,
    totalProducts: 0,
    fetchProducts: vi.fn()
  }))
}));

// Mock the ImageGallery component
vi.mock('../../components/ImageGallery', () => ({
  default: ({ images, alt }) => (
    <div data-testid="image-gallery">
      <img src={images?.[0]} alt={alt} />
    </div>
  )
}));

// Mock the AddToCartButton component
vi.mock('../../components/AddToCartButton', () => ({
  default: ({ productId, stockStatus, onAddToCart }) => (
    <button 
      data-testid="add-to-cart" 
      onClick={() => onAddToCart?.(productId, 1)}
      disabled={stockStatus === 'out_of_stock'}
    >
      {stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
    </button>
  )
}));

const mockApiResponse = {
  success: true,
  data: {
    _id: 'product-123',
    name: 'GrapheneOS Pixel 9 Pro',
    slug: 'grapheneos-pixel-9-pro',
    shortDescription: 'Premium privacy-focused smartphone with GrapheneOS pre-installed',
    longDescription: 'The Pixel 9 Pro with GrapheneOS offers the ultimate in mobile privacy and security. This device features a stunning 6.3-inch OLED display with 120Hz refresh rate, advanced triple-camera system with computational photography, and the latest Titan M security chip.',
    price: 899.99,
    images: [
      'https://example.com/pixel9pro-front.jpg',
      'https://example.com/pixel9pro-back.jpg',
      'https://example.com/pixel9pro-side.jpg'
    ],
    condition: 'new',
    stockStatus: 'in_stock',
    stockQuantity: 25,
    attributes: [
      { name: 'Display', value: '6.3" OLED, 120Hz' },
      { name: 'Storage', value: '256GB' },
      { name: 'RAM', value: '12GB' },
      { name: 'Color', value: 'Obsidian' }
    ],
    category: {
      _id: 'cat-123',
      name: 'Smartphones',
      slug: 'smartphones'
    }
  }
};

const mockApiError = {
  success: false,
  error: 'Product not found'
};

const renderIntegrationTest = (initialRoute = '/') => {
  return render(<AppRoutes />, {
    initialEntries: [initialRoute]
  });
};

describe('Product Details Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document title
    document.title = 'Test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load and display product details from API successfully', async () => {
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    renderIntegrationTest('/products/grapheneos-pixel-9-pro');

    // Should show loading state initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText(/loading product details/i)).toBeInTheDocument();

    // Wait for API call and content to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // Verify API was called with correct endpoint
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/products/grapheneos-pixel-9-pro',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );

    // Verify product details are displayed
    expect(screen.getByText('Premium privacy-focused smartphone with GrapheneOS pre-installed')).toBeInTheDocument();
    expect(screen.getByText('£899.99')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    // Check category is displayed in the details section
    const detailsSection = screen.getByTestId('details-section');
    expect(detailsSection).toHaveTextContent('Smartphones');

    // Verify specifications are displayed
    expect(screen.getByText('Specifications')).toBeInTheDocument();
    expect(screen.getByText('Display:')).toBeInTheDocument();
    expect(screen.getByText('6.3" OLED, 120Hz')).toBeInTheDocument();

    // Verify image gallery is rendered
    expect(screen.getByTestId('image-gallery')).toBeInTheDocument();

    // Verify add to cart button is rendered
    expect(screen.getByTestId('add-to-cart')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiError
    });

    renderIntegrationTest('/products/non-existent-product');

    // Wait for error state to appear
    await waitFor(() => {
      expect(screen.getByText(/error loading product/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Product not found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('should handle network errors', async () => {
    // Mock network error
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderIntegrationTest('/products/test-product');

    // Wait for error state to appear
    await waitFor(() => {
      expect(screen.getByText(/error loading product/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('should handle HTTP errors (404, 500, etc.)', async () => {
    // Mock HTTP error response
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    renderIntegrationTest('/products/deleted-product');

    // Wait for error state to appear
    await waitFor(() => {
      expect(screen.getByText(/error loading product/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/HTTP error! status: 404/i)).toBeInTheDocument();
  });

  it('should retry API call when retry button is clicked', async () => {
    const user = userEvent.setup();

    // Mock initial error, then success
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiError
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

    renderIntegrationTest('/products/grapheneos-pixel-9-pro');

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/error loading product/i)).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    // Should show loading again
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Wait for successful load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // Verify API was called twice
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should update document title when product loads', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    renderIntegrationTest('/products/grapheneos-pixel-9-pro');

    await waitFor(() => {
      expect(document.title).toContain('GrapheneOS Pixel 9 Pro');
    });

    expect(document.title).toBe('GrapheneOS Pixel 9 Pro - GrapheneOS Store');
  });

  it('should render breadcrumb navigation correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    renderIntegrationTest('/products/grapheneos-pixel-9-pro');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // Check breadcrumb navigation
    const breadcrumbNav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(breadcrumbNav).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /smartphones/i })).toBeInTheDocument();
  });

  it('should handle add to cart interaction', async () => {
    const user = userEvent.setup();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    // Mock console.log for cart functionality
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderIntegrationTest('/products/grapheneos-pixel-9-pro');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // Click add to cart button
    const addToCartButton = screen.getByTestId('add-to-cart');
    await user.click(addToCartButton);

    // Verify cart function was called (mocked as console.log)
    expect(consoleSpy).toHaveBeenCalledWith('Adding 1 of product product-123 to cart');

    consoleSpy.mockRestore();
  });

  it('should display different stock statuses correctly', async () => {
    // Test low stock
    const lowStockProduct = {
      ...mockApiResponse,
      data: {
        ...mockApiResponse.data,
        stockStatus: 'low_stock',
        stockQuantity: 3
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => lowStockProduct
    });

    renderIntegrationTest('/products/grapheneos-pixel-9-pro');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // Should show low stock warning
    expect(screen.getByText(/hurry! only 3 left in stock!/i)).toBeInTheDocument();
  });

  it('should handle out of stock products', async () => {
    const outOfStockProduct = {
      ...mockApiResponse,
      data: {
        ...mockApiResponse.data,
        stockStatus: 'out_of_stock',
        stockQuantity: 0
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => outOfStockProduct
    });

    renderIntegrationTest('/products/grapheneos-pixel-9-pro');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // Add to cart button should be disabled and show "Out of Stock"
    const addToCartButton = screen.getByTestId('add-to-cart');
    expect(addToCartButton).toBeDisabled();
    expect(addToCartButton).toHaveTextContent('Out of Stock');
  });

  // Navigation test moved to ProductFlow integration tests

  it('should handle products with minimal data gracefully', async () => {
    const minimalProduct = {
      success: true,
      data: {
        _id: 'product-456',
        name: 'Minimal Product',
        slug: 'minimal-product',
        price: 99.99,
        images: ['https://example.com/minimal.jpg'],
        stockStatus: 'in_stock',
        stockQuantity: 5,
        condition: 'new'
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => minimalProduct
    });

    renderIntegrationTest('/products/minimal-product');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Minimal Product' })).toBeInTheDocument();
    });

    expect(screen.getByText('£99.99')).toBeInTheDocument();
    
    // Should not crash when optional fields are missing
    expect(screen.queryByText(/specifications/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/category/i)).not.toBeInTheDocument();
  });

  it('should handle responsive layout correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    const { container } = renderIntegrationTest('/products/grapheneos-pixel-9-pro');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // Check responsive layout classes
    const detailsContainer = container.querySelector('[data-testid="product-details-container"]');
    expect(detailsContainer).toHaveClass('flex', 'flex-col', 'lg:flex-row');

    const imageSection = container.querySelector('[data-testid="image-section"]');
    expect(imageSection).toHaveClass('w-full', 'lg:w-1/2');

    const detailsSection = container.querySelector('[data-testid="details-section"]');
    expect(detailsSection).toHaveClass('w-full', 'lg:w-1/2');
  });

  it('should handle API timeout gracefully', async () => {
    // Mock a timeout scenario
    fetch.mockImplementationOnce(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 100)
      )
    );

    renderIntegrationTest('/products/slow-product');

    await waitFor(() => {
      expect(screen.getByText(/error loading product/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(screen.getByText('Timeout')).toBeInTheDocument();
  });
});