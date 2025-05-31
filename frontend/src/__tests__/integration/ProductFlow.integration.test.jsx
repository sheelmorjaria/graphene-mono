import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../App';

// Mock fetch globally
global.fetch = vi.fn();

const mockProductsListResponse = {
  success: true,
  data: {
    products: [
      {
        _id: 'product-1',
        name: 'GrapheneOS Pixel 9 Pro',
        slug: 'grapheneos-pixel-9-pro',
        shortDescription: 'Premium privacy-focused smartphone',
        price: 899.99,
        images: ['https://example.com/pixel9pro.jpg'],
        condition: 'new',
        stockStatus: 'in_stock',
        stockQuantity: 25,
        category: {
          _id: 'cat-1',
          name: 'Smartphones',
          slug: 'smartphones'
        }
      },
      {
        _id: 'product-2',
        name: 'GrapheneOS Pixel 9',
        slug: 'grapheneos-pixel-9',
        shortDescription: 'High-performance privacy smartphone',
        price: 799.99,
        images: ['https://example.com/pixel9.jpg'],
        condition: 'new',
        stockStatus: 'in_stock',
        stockQuantity: 32,
        category: {
          _id: 'cat-1',
          name: 'Smartphones',
          slug: 'smartphones'
        }
      }
    ],
    totalPages: 1,
    currentPage: 1,
    totalProducts: 2
  }
};

const mockProductDetailsResponse = {
  success: true,
  data: {
    _id: 'product-1',
    name: 'GrapheneOS Pixel 9 Pro',
    slug: 'grapheneos-pixel-9-pro',
    shortDescription: 'Premium privacy-focused smartphone with GrapheneOS pre-installed',
    longDescription: 'The Pixel 9 Pro with GrapheneOS offers the ultimate in mobile privacy and security.',
    price: 899.99,
    images: [
      'https://example.com/pixel9pro-front.jpg',
      'https://example.com/pixel9pro-back.jpg'
    ],
    condition: 'new',
    stockStatus: 'in_stock',
    stockQuantity: 25,
    attributes: [
      { name: 'Display', value: '6.3" OLED, 120Hz' },
      { name: 'Storage', value: '256GB' }
    ],
    category: {
      _id: 'cat-1',
      name: 'Smartphones',
      slug: 'smartphones'
    }
  }
};

const renderFlowTest = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppRoutes />
    </MemoryRouter>
  );
};

describe('Product Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should complete full user journey from home to product details', async () => {
    const user = userEvent.setup();

    // Mock API responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductsListResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductDetailsResponse
      });

    // Start at home page (should redirect to products)
    renderFlowTest('/');

    // Should redirect to products and load the list
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Verify we're on products page
    expect(screen.getByText('GrapheneOS Pixel 9')).toBeInTheDocument();
    expect(screen.getAllByText('View Details')).toHaveLength(2);

    // Click on first product's "View Details"
    const viewDetailsButtons = screen.getAllByText('View Details');
    await user.click(viewDetailsButtons[0]);

    // Should navigate to product details page
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // Verify product details are displayed
    expect(screen.getByText('Premium privacy-focused smartphone with GrapheneOS pre-installed')).toBeInTheDocument();
    expect(screen.getByText('$899.99')).toBeInTheDocument();
    expect(screen.getByText('Specifications')).toBeInTheDocument();

    // Verify both API calls were made
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(1, 'http://localhost:3000/api/products', expect.anything());
    expect(fetch).toHaveBeenNthCalledWith(2, 'http://localhost:3000/api/products/grapheneos-pixel-9-pro', expect.anything());
  });

  it('should handle navigation between product list and details', async () => {
    const user = userEvent.setup();

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductsListResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductDetailsResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductsListResponse
      });

    renderFlowTest('/products');

    // Wait for products list to load
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Navigate to product details
    const viewDetailsButton = screen.getAllByText('View Details')[0];
    await user.click(viewDetailsButton);

    // Wait for product details to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // Navigate back using breadcrumb
    const productsLink = screen.getByRole('link', { name: /products/i });
    await user.click(productsLink);

    // Should be back on products list
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('should handle error recovery flow', async () => {
    const user = userEvent.setup();

    // Mock initial error, then success
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductsListResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'Product not found' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductDetailsResponse
      });

    renderFlowTest('/products');

    // Wait for products list
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Click to view details (will fail)
    const viewDetailsButton = screen.getAllByText('View Details')[0];
    await user.click(viewDetailsButton);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/error loading product/i)).toBeInTheDocument();
    });

    // Click retry
    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    // Should load successfully
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('should handle product filtering and then navigation to details', async () => {
    const user = userEvent.setup();

    const filteredResponse = {
      ...mockProductsListResponse,
      data: {
        ...mockProductsListResponse.data,
        products: [mockProductsListResponse.data.products[0]] // Only first product
      }
    };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductsListResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => filteredResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductDetailsResponse
      });

    renderFlowTest('/products');

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Should show both products initially
    expect(screen.getByText('GrapheneOS Pixel 9')).toBeInTheDocument();

    // Apply filter (simulate filter interaction)
    const categoryFilter = screen.getByLabelText(/smartphones/i);
    await user.click(categoryFilter);

    // Wait for filtered results
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Navigate to product details
    const viewDetailsButton = screen.getByText('View Details');
    await user.click(viewDetailsButton);

    // Should load product details
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('should handle product search and navigation flow', async () => {
    const user = userEvent.setup();

    const searchResponse = {
      ...mockProductsListResponse,
      data: {
        ...mockProductsListResponse.data,
        products: [mockProductsListResponse.data.products[0]],
        totalProducts: 1
      }
    };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductsListResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => searchResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductDetailsResponse
      });

    renderFlowTest('/products');

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Perform search
    const searchInput = screen.getByPlaceholderText(/search products/i);
    await user.type(searchInput, 'Pixel 9 Pro');
    await user.keyboard('{Enter}');

    // Wait for search results
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Should only show searched product
    expect(screen.queryByText('GrapheneOS Pixel 9')).not.toBeInTheDocument();

    // Navigate to product details
    const viewDetailsButton = screen.getByText('View Details');
    await user.click(viewDetailsButton);

    // Should load product details
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(3);
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
      'http://localhost:3000/api/products/grapheneos-pixel-9-pro',
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
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductsListResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductDetailsResponse
      });

    renderFlowTest('/products');

    // Navigate to product details
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    const viewDetailsButton = screen.getAllByText('View Details')[0];
    await user.click(viewDetailsButton);

    // Wait for product details to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // Test add to cart with quantity selection
    const quantitySelect = screen.getByLabelText(/quantity/i);
    await user.selectOptions(quantitySelect, '3');

    const addToCartButton = screen.getByTestId('add-to-cart');
    await user.click(addToCartButton);

    // Verify cart interaction
    expect(consoleSpy).toHaveBeenCalledWith('Adding 3 of product product-1 to cart');

    consoleSpy.mockRestore();
  });

  it('should handle pagination flow with product details', async () => {
    const user = userEvent.setup();

    const page1Response = {
      ...mockProductsListResponse,
      data: {
        ...mockProductsListResponse.data,
        totalPages: 2,
        currentPage: 1
      }
    };

    const page2Response = {
      ...mockProductsListResponse,
      data: {
        products: [
          {
            ...mockProductsListResponse.data.products[1],
            _id: 'product-3',
            name: 'GrapheneOS Pixel 8 Pro',
            slug: 'grapheneos-pixel-8-pro'
          }
        ],
        totalPages: 2,
        currentPage: 2,
        totalProducts: 3
      }
    };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => page1Response
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => page2Response
      });

    renderFlowTest('/products');

    // Wait for page 1 to load
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Navigate to page 2
    const nextPageButton = screen.getByLabelText(/next page/i);
    await user.click(nextPageButton);

    // Wait for page 2 to load
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 8 Pro')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should maintain state when navigating back from product details', async () => {
    const user = userEvent.setup();

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductsListResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProductDetailsResponse
      });

    renderFlowTest('/products?page=1&sort=price-asc');

    // Wait for products list with parameters
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Navigate to product details
    const viewDetailsButton = screen.getAllByText('View Details')[0];
    await user.click(viewDetailsButton);

    // Wait for product details
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // Navigate back using browser back button (simulated)
    window.history.back();

    // Should return to products list with maintained state
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9')).toBeInTheDocument();
    });
  });
});