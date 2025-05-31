import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../App';

// Mock fetch globally for integration tests
global.fetch = vi.fn();

const mockSearchResponse = {
  success: true,
  data: {
    products: [
      {
        id: '1',
        name: 'GrapheneOS Pixel 9 Pro',
        slug: 'grapheneos-pixel-9-pro',
        shortDescription: 'Premium privacy-focused smartphone with GrapheneOS',
        price: 899.99,
        images: ['https://example.com/pixel9pro.jpg'],
        condition: 'new',
        stockStatus: 'in_stock',
        category: {
          _id: 'cat-1',
          name: 'Smartphones',
          slug: 'smartphones'
        },
        createdAt: '2024-01-15T10:30:00.000Z'
      },
      {
        id: '2',
        name: 'GrapheneOS Pixel 9',
        slug: 'grapheneos-pixel-9',
        shortDescription: 'High-performance privacy smartphone',
        price: 799.99,
        images: ['https://example.com/pixel9.jpg'],
        condition: 'new',
        stockStatus: 'in_stock',
        category: {
          _id: 'cat-1',
          name: 'Smartphones',
          slug: 'smartphones'
        },
        createdAt: '2024-01-15T10:30:00.000Z'
      }
    ],
    totalProducts: 2,
    totalPages: 1,
    currentPage: 1
  }
};

const mockEmptyResponse = {
  success: true,
  data: {
    products: [],
    totalProducts: 0,
    totalPages: 0,
    currentPage: 1
  }
};

const mockErrorResponse = {
  success: false,
  error: 'Search query is required'
};

const mockProductsListResponse = {
  success: true,
  data: [
    {
      id: '1',
      name: 'GrapheneOS Pixel 9 Pro',
      slug: 'grapheneos-pixel-9-pro',
      shortDescription: 'Premium privacy-focused smartphone',
      price: 899.99,
      images: ['https://example.com/pixel9pro.jpg'],
      condition: 'new',
      stockStatus: 'in_stock',
      category: { name: 'Smartphones' }
    }
  ],
  pagination: {
    page: 1,
    limit: 12,
    total: 1,
    pages: 1
  }
};

const renderIntegrationTest = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppRoutes />
    </MemoryRouter>
  );
};

describe('Search Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should complete full search flow from header search bar', async () => {
    const user = userEvent.setup();

    // Mock products list API call first
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductsListResponse
    });

    // Mock successful search response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResponse
    });

    renderIntegrationTest('/products');

    // Find search bar in header
    const searchInput = screen.getByPlaceholderText('Search products...');
    expect(searchInput).toBeInTheDocument();

    // Type search query
    await user.type(searchInput, 'pixel');

    // Submit search (should navigate to search page)
    await user.keyboard('{Enter}');

    // Should navigate to search results page
    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });

    // Should show search results
    await waitFor(() => {
      expect(screen.getByText('Found 2 products for "pixel"')).toBeInTheDocument();
    });

    expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    expect(screen.getByText('GrapheneOS Pixel 9')).toBeInTheDocument();

    // Verify API was called with correct parameters
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/products/search?q=pixel&page=1',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('should handle direct navigation to search page with query', async () => {
    // Mock successful search response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResponse
    });

    renderIntegrationTest('/search?q=smartphone');

    // Should show search results page
    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });

    // Should show results for the query from URL
    await waitFor(() => {
      expect(screen.getByText('Found 2 products for "smartphone"')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/products/search?q=smartphone&page=1',
      expect.anything()
    );
  });

  it('should handle search with no results', async () => {
    const user = userEvent.setup();

    // Mock products list API call first
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductsListResponse
    });

    // Mock empty search response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEmptyResponse
    });

    renderIntegrationTest('/products');

    // Search for something that returns no results
    const searchInput = screen.getByPlaceholderText('Search products...');
    await user.type(searchInput, 'nonexistent');
    await user.keyboard('{Enter}');

    // Should navigate to search results page
    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });

    // Should show no results message
    await waitFor(() => {
      expect(screen.getByText(/no products found/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/try searching for different keywords/i)).toBeInTheDocument();
  });

  it('should handle search API errors', async () => {
    const user = userEvent.setup();

    // Mock products list API call first
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductsListResponse
    });

    // Mock network error
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderIntegrationTest('/products');

    const searchInput = screen.getByPlaceholderText('Search products...');
    await user.type(searchInput, 'pixel');
    await user.keyboard('{Enter}');

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText(/error searching products/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('should handle search with sorting', async () => {
    const user = userEvent.setup();

    // Mock search response for initial search
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResponse
    });

    // Mock search response for sorted search
    const sortedResponse = {
      ...mockSearchResponse,
      data: {
        ...mockSearchResponse.data,
        products: [mockSearchResponse.data.products[1], mockSearchResponse.data.products[0]] // Reversed order
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sortedResponse
    });

    renderIntegrationTest('/search?q=pixel');

    // Wait for initial results
    await waitFor(() => {
      expect(screen.getByText('Found 2 products for "pixel"')).toBeInTheDocument();
    });

    // Change sorting
    const sortSelect = screen.getByLabelText(/sort by/i);
    await user.selectOptions(sortSelect, 'price-asc');

    // Should make a new API call with sorting parameters
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/products/search?q=pixel&page=1&sortBy=price&sortOrder=asc',
        expect.anything()
      );
    });
  });

  it('should handle search with filters', async () => {
    const user = userEvent.setup();

    // Mock search response for initial search
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResponse
    });

    // Mock search response for filtered search
    const filteredResponse = {
      ...mockSearchResponse,
      data: {
        ...mockSearchResponse.data,
        products: [mockSearchResponse.data.products[0]], // Only one product
        totalProducts: 1
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => filteredResponse
    });

    renderIntegrationTest('/search?q=pixel');

    // Wait for initial results
    await waitFor(() => {
      expect(screen.getByText('Found 2 products for "pixel"')).toBeInTheDocument();
    });

    // Apply condition filter
    const conditionSelect = screen.getByLabelText(/condition/i);
    await user.selectOptions(conditionSelect, 'new');

    // Should make a new API call with filter parameters
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/products/search?q=pixel&page=1&condition=new',
        expect.anything()
      );
    });
  });

  it('should handle pagination in search results', async () => {
    const user = userEvent.setup();

    // Mock multi-page search response
    const multiPageResponse = {
      success: true,
      data: {
        products: [mockSearchResponse.data.products[0]], // One product on page 1
        totalProducts: 25,
        totalPages: 3,
        currentPage: 1
      }
    };

    // Mock page 2 response
    const page2Response = {
      success: true,
      data: {
        products: [mockSearchResponse.data.products[1]], // Different product on page 2
        totalProducts: 25,
        totalPages: 3,
        currentPage: 2
      }
    };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => multiPageResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => page2Response
      });

    renderIntegrationTest('/search?q=pixel');

    // Wait for initial results
    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    // Click next page
    const nextButton = screen.getByRole('button', { name: /next page/i });
    await user.click(nextButton);

    // Should make API call for page 2
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/products/search?q=pixel&page=2',
        expect.anything()
      );
    });

    // Should show page 2 indicator
    await waitFor(() => {
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });
  });

  it('should handle retry after search error', async () => {
    const user = userEvent.setup();

    // Mock initial error
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderIntegrationTest('/search?q=pixel');

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText(/error searching products/i)).toBeInTheDocument();
    });

    // Mock successful retry
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResponse
    });

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    // Should show results after retry
    await waitFor(() => {
      expect(screen.getByText('Found 2 products for "pixel"')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should update document title based on search query', async () => {
    // Mock successful search response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResponse
    });

    renderIntegrationTest('/search?q=smartphone');

    // Wait for the search results to load and title to update
    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait specifically for the title to update
    await waitFor(() => {
      expect(document.title).toBe('Search: smartphone - GrapheneOS Store');
    }, { timeout: 2000 });
  });

  it('should handle special characters in search query', async () => {
    const user = userEvent.setup();

    // Mock products list API call first
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductsListResponse
    });

    // Mock successful search response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResponse
    });

    renderIntegrationTest('/products');

    const searchInput = screen.getByPlaceholderText('Search products...');
    await user.type(searchInput, 'C++ programming');
    await user.keyboard('{Enter}');

    // Should properly encode the query in the API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/products/search?q=C%2B%2B+programming&page=1',
        expect.anything()
      );
    });
  });

  it('should navigate from search results to product details', async () => {
    const user = userEvent.setup();

    // Mock search response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResponse
    });

    // Mock product details response
    const productDetailsResponse = {
      success: true,
      data: {
        _id: '1',
        name: 'GrapheneOS Pixel 9 Pro',
        slug: 'grapheneos-pixel-9-pro',
        shortDescription: 'Premium privacy-focused smartphone with GrapheneOS',
        longDescription: 'Advanced security features...',
        price: 899.99,
        images: ['https://example.com/pixel9pro.jpg'],
        condition: 'new',
        stockStatus: 'in_stock',
        stockQuantity: 15,
        attributes: [
          { name: 'Display', value: '6.3" OLED, 120Hz' },
          { name: 'Storage', value: '256GB' }
        ],
        category: {
          _id: 'cat-1',
          name: 'Smartphones',
          slug: 'smartphones'
        },
        isActive: true
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => productDetailsResponse
    });

    renderIntegrationTest('/search?q=pixel');

    // Wait for search results
    await waitFor(() => {
      expect(screen.getByText('Found 2 products for "pixel"')).toBeInTheDocument();
    });

    // Click on the first product's "View Details" button
    const viewDetailsButtons = screen.getAllByText('View Details');
    await user.click(viewDetailsButtons[0]);

    // Should navigate to product details page
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GrapheneOS Pixel 9 Pro' })).toBeInTheDocument();
    });

    // Should show product details
    expect(screen.getByText('Advanced security features...')).toBeInTheDocument();
    expect(screen.getByText('£899.99')).toBeInTheDocument();

    // Verify both API calls were made
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(1, 
      'http://localhost:3000/api/products/search?q=pixel&page=1',
      expect.anything()
    );
    expect(fetch).toHaveBeenNthCalledWith(2,
      'http://localhost:3000/api/products/grapheneos-pixel-9-pro',
      expect.anything()
    );
  });
});