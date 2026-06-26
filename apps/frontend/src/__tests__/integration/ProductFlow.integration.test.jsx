import { render, screen, waitFor, within, userEvent } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppRoutes } from '../../App';

// Mock fetch globally (used by the product details service)
global.fetch = vi.fn();

// Mock the ImageGallery component (heavy / network-bound)
vi.mock('../../components/ImageGallery', () => ({
  default: ({ images, alt }) => (
    <div data-testid="image-gallery">
      <img src={images?.[0]} alt={alt} />
    </div>
  )
}));

// Mock AddToCartButton to keep the flow test focused on routing/data
vi.mock('../../components/AddToCartButton', () => ({
  default: ({ productId, variationId, stockStatus, selectedQuantity, onAddToCart }) => (
    <div>
      <label htmlFor="qty">Quantity</label>
      <select
        id="qty"
        data-testid="quantity-select"
        aria-label="Quantity"
        value={selectedQuantity || 1}
        onChange={(e) => onAddToCart?.(productId, Number(e.target.value), variationId)}
      >
        {[1, 2, 3].map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <button
        data-testid="add-to-cart"
        disabled={stockStatus === 'out_of_stock'}
        onClick={() => onAddToCart?.(productId, selectedQuantity || 1, variationId)}
      >
        {stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  )
}));

// The products list comes from the useProducts hook (mocked, so no fetch).
// The product details page fetches via productDetailsService -> global.fetch.
const products = [
  {
    id: 'product-1',
    _id: 'product-1',
    name: 'GrapheneOS Pixel 9 Pro',
    slug: 'grapheneos-pixel-9-pro',
    shortDescription: 'Premium privacy-focused smartphone',
    price: 899.99,
    images: ['https://example.com/pixel9pro.jpg'],
    condition: 'excellent',
    stockStatus: 'in_stock',
    stockQuantity: 25,
    category: { _id: 'cat-1', name: 'Smartphones', slug: 'smartphones' }
  },
  {
    id: 'product-2',
    _id: 'product-2',
    name: 'GrapheneOS Pixel 9',
    slug: 'grapheneos-pixel-9',
    shortDescription: 'High-performance privacy smartphone',
    price: 799.99,
    images: ['https://example.com/pixel9.jpg'],
    condition: 'excellent',
    stockStatus: 'in_stock',
    stockQuantity: 32,
    category: { _id: 'cat-1', name: 'Smartphones', slug: 'smartphones' }
  }
];

// Mock the useProducts hook (static list; fetchProducts is a spy)
vi.mock('../../hooks/useProducts', () => ({
  default: vi.fn(() => ({
    products,
    pagination: { page: 1, limit: 12, total: products.length, pages: 1 },
    loading: false,
    error: null,
    fetchProducts: vi.fn()
  }))
}));

const detailsVariations = [
  {
    _id: 'var-1',
    condition: 'excellent',
    color: 'Obsidian',
    storage: '256GB',
    price: 899.99,
    stockStatus: 'in_stock',
    stockQuantity: 25,
    images: ['https://example.com/pixel9pro-front.jpg']
  }
];

const mockProductDetailsResponse = {
  success: true,
  data: {
    _id: 'product-1',
    name: 'GrapheneOS Pixel 9 Pro',
    slug: 'grapheneos-pixel-9-pro',
    shortDescription: 'Premium privacy-focused smartphone with GrapheneOS pre-installed',
    longDescription: 'The Pixel 9 Pro with GrapheneOS offers the ultimate in mobile privacy and security.',
    price: 899.99,
    priceRange: { min: 899.99, max: 899.99 },
    images: [
      'https://example.com/pixel9pro-front.jpg',
      'https://example.com/pixel9pro-back.jpg'
    ],
    condition: 'excellent',
    stockStatus: 'in_stock',
    stockQuantity: 25,
    variations: detailsVariations,
    attributes: [
      { name: 'Display', value: '6.3" OLED, 120Hz' },
      { name: 'Storage', value: '256GB' }
    ],
    category: { _id: 'cat-1', name: 'Smartphones', slug: 'smartphones' }
  }
};

const renderFlowTest = (initialRoute = '/') => {
  return render(<AppRoutes />, {
    initialEntries: [initialRoute]
  });
};

// Selecting a variation requires choosing a condition and a color.
const selectVariation = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Excellent' }));
  await userEvent.click(screen.getByRole('button', { name: 'Obsidian' }));
};

describe('Product Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should complete full user journey from products list to product details', async () => {
    // Only the product details page performs a fetch (the list uses the mocked hook)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductDetailsResponse
    });

    renderFlowTest('/products');

    // Products list renders from the mocked hook
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });
    expect(screen.getByText('GrapheneOS Pixel 9')).toBeInTheDocument();
    expect(screen.getAllByText('View Details')).toHaveLength(2);

    // Click on first product's "View Details"
    const viewDetailsButtons = screen.getAllByText('View Details');
    await userEvent.click(viewDetailsButtons[0]);

    // Should navigate to product details page
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // Verify product details are displayed
    expect(screen.getByText('Premium privacy-focused smartphone with GrapheneOS pre-installed')).toBeInTheDocument();
    expect(screen.getByText('£899.99')).toBeInTheDocument();
    expect(screen.getByText('Specifications')).toBeInTheDocument();

    // Verify the details API call was made with the correct endpoint
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/products/grapheneos-pixel-9-pro',
      expect.anything()
    );
  });

  it('should handle navigation between product list and details', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductDetailsResponse
    });

    renderFlowTest('/products');

    // Wait for products list to load
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Navigate to product details
    await userEvent.click(screen.getAllByText('View Details')[0]);

    // Wait for product details to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // Navigate back using breadcrumb (scoped to the breadcrumb navigation)
    const breadcrumbNav = screen.getByRole('navigation', { name: /breadcrumb/i });
    const productsLink = within(breadcrumbNav).getByRole('link', { name: /products/i });
    await userEvent.click(productsLink);

    // Should be back on products list
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9')).toBeInTheDocument();
    });
  });

  it('should handle error recovery flow', async () => {
    // Initial details error, then success on retry
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'Product not found' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductDetailsResponse
      });

    renderFlowTest('/products');

    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Click to view details (will fail)
    await userEvent.click(screen.getAllByText('View Details')[0]);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/error loading product/i)).toBeInTheDocument();
    });

    // Click retry
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));

    // Should load successfully
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should allow filtering and then navigation to details', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductDetailsResponse
    });

    renderFlowTest('/products');

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });
    expect(screen.getByText('GrapheneOS Pixel 9')).toBeInTheDocument();

    // Apply a condition filter (FilterSidebar exposes condition buttons)
    const excellentButton = screen.getByRole('button', { name: /^Excellent$/ });
    await userEvent.click(excellentButton);

    // Both products still render (hook is mocked/static); navigate to details
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    await userEvent.click(screen.getAllByText('View Details')[0]);

    // Should load product details
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });
  });

  it('should handle direct URL access to product details', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductDetailsResponse
    });

    // Access product details directly via URL
    renderFlowTest('/products/grapheneos-pixel-9-pro');

    // Should load product details directly
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // Verify API was called once for product details
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/products/grapheneos-pixel-9-pro',
      expect.anything()
    );
  });

  it('should handle 404 for non-existent product', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    renderFlowTest('/products/non-existent-product');

    // Should show error for non-existent product
    await waitFor(() => {
      expect(screen.getByText(/error loading product/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/HTTP error! status: 404/i)).toBeInTheDocument();
  });

  it('should handle add to cart flow integration', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductDetailsResponse
    });

    renderFlowTest('/products');

    // Navigate to product details
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });
    await userEvent.click(screen.getAllByText('View Details')[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // A variation must be selected before the Add to Cart button is active
    await selectVariation();

    // Choose a quantity of 3
    const quantitySelect = screen.getByLabelText(/quantity/i);
    await userEvent.selectOptions(quantitySelect, '3');

    await userEvent.click(screen.getByTestId('add-to-cart'));

    // handleAddToCart logs the call details (real addToCart runs via CartContext)
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('handleAddToCart called with:', {
        productId: 'product-1',
        quantity: 3,
        variationId: 'var-1'
      });
    });

    consoleSpy.mockRestore();
  });

  it('should maintain state when navigating back from product details', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductDetailsResponse
    });

    renderFlowTest('/products?sort=price-asc');

    // Wait for products list
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Navigate to product details
    await userEvent.click(screen.getAllByText('View Details')[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // Navigate back to the list via the breadcrumb Products link
    const breadcrumbNav = screen.getByRole('navigation', { name: /breadcrumb/i });
    await userEvent.click(within(breadcrumbNav).getByRole('link', { name: /products/i }));

    // Should return to products list with maintained state
    await waitFor(() => {
      expect(screen.getAllByText('View Details')).toHaveLength(2);
    });
    expect(screen.getByText('GrapheneOS Pixel 9')).toBeInTheDocument();
  });
});
