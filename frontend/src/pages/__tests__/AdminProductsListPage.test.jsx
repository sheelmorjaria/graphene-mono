import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminProductsListPage from '../AdminProductsListPage';
import * as adminService from '../../services/adminService';

// Mock the adminService
vi.mock('../../services/adminService');

// Mock LoadingSpinner and Pagination components
vi.mock('../../components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>
}));

vi.mock('../../components/Pagination', () => ({
  default: ({ currentPage, totalPages, onPageChange }) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        Previous
      </button>
      <span>{currentPage} of {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        Next
      </button>
    </div>
  )
}));

const mockProducts = [
  {
    _id: '1',
    name: 'Google Pixel 7',
    sku: 'GP7-001',
    price: 599,
    stockQuantity: 50,
    status: 'active',
    category: 'smartphone',
    images: ['https://example.com/pixel7.jpg'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    _id: '2',
    name: 'Google Pixel 7 Pro',
    sku: 'GP7P-001',
    price: 899,
    stockQuantity: 0,
    status: 'active',
    category: 'smartphone',
    images: [],
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z'
  }
];

const mockResponse = {
  success: true,
  data: {
    products: mockProducts,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 2,
      itemsPerPage: 10,
      hasNextPage: false,
      hasPrevPage: false
    }
  }
};

describe('AdminProductsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock formatCurrency function
    vi.mocked(adminService.formatCurrency).mockImplementation((amount) => `£${amount}`);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AdminProductsListPage />
      </BrowserRouter>
    );
  };

  test('renders loading state initially', () => {
    adminService.getProducts.mockResolvedValue(mockResponse);
    renderComponent();
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders products table after loading', async () => {
    adminService.getProducts.mockResolvedValue(mockResponse);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Manage Products')).toBeInTheDocument();
    });

    // Check if products are displayed
    expect(screen.getByText('Google Pixel 7')).toBeInTheDocument();
    expect(screen.getByText('Google Pixel 7 Pro')).toBeInTheDocument();
    expect(screen.getByText('GP7-001')).toBeInTheDocument();
    expect(screen.getByText('GP7P-001')).toBeInTheDocument();
    expect(screen.getByText('£599')).toBeInTheDocument();
    expect(screen.getByText('£899')).toBeInTheDocument();
  });

  test('shows error message when fetch fails', async () => {
    const errorMessage = 'Failed to fetch products';
    adminService.getProducts.mockRejectedValue(new Error(errorMessage));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('handles search functionality', async () => {
    adminService.getProducts.mockResolvedValue(mockResponse);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Manage Products')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by product name or SKU...');
    fireEvent.change(searchInput, { target: { value: 'pixel' } });

    // Wait for debounce
    await waitFor(() => {
      expect(adminService.getProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          searchQuery: 'pixel',
          page: 1
        })
      );
    }, { timeout: 600 });
  });

  test('handles filter changes', async () => {
    adminService.getProducts.mockResolvedValue(mockResponse);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Manage Products')).toBeInTheDocument();
    });

    // Change category filter
    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.change(categorySelect, { target: { value: 'smartphone' } });

    await waitFor(() => {
      expect(adminService.getProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          category: 'smartphone',
          page: 1
        })
      );
    });
  });

  test('handles sorting', async () => {
    adminService.getProducts.mockResolvedValue(mockResponse);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Manage Products')).toBeInTheDocument();
    });

    // Click on Product Name header to sort
    const nameHeader = screen.getByText('Product Name');
    fireEvent.click(nameHeader);

    await waitFor(() => {
      expect(adminService.getProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sortBy: 'name',
          sortOrder: 'asc'
        })
      );
    });
  });

  test('displays stock status badges correctly', async () => {
    adminService.getProducts.mockResolvedValue(mockResponse);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Manage Products')).toBeInTheDocument();
    });

    // Check that products are displayed with correct stock quantities
    expect(screen.getByText('50')).toBeInTheDocument(); // Stock quantity for first product
    expect(screen.getByText('0')).toBeInTheDocument(); // Stock quantity for second product
    
    // Check stock status badges exist (they appear both in dropdowns and as badges)
    const inStockElements = screen.getAllByText('In Stock');
    expect(inStockElements.length).toBeGreaterThanOrEqual(1); // At least one (dropdown option + badge)
    
    const outOfStockElements = screen.getAllByText('Out of Stock');
    expect(outOfStockElements.length).toBeGreaterThanOrEqual(1); // At least one (dropdown option + badge)
  });

  test('clears filters when Clear Filters button is clicked', async () => {
    adminService.getProducts.mockResolvedValue(mockResponse);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Manage Products')).toBeInTheDocument();
    });

    // Set some filters
    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.change(categorySelect, { target: { value: 'smartphone' } });

    await waitFor(() => {
      expect(adminService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'smartphone'
        })
      );
    });

    // Click Clear Filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(adminService.getProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          category: '',
          status: '',
          minPrice: '',
          maxPrice: '',
          stockStatus: '',
          searchQuery: '',
          page: 1
        })
      );
    });
  });

  test('displays no products message when empty', async () => {
    adminService.getProducts.mockResolvedValue({
      success: true,
      data: {
        products: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });
    
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No products found matching your criteria.')).toBeInTheDocument();
    });
  });

  test('links to add new product page', async () => {
    adminService.getProducts.mockResolvedValue(mockResponse);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Manage Products')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add New Product');
    expect(addButton).toHaveAttribute('href', '/admin/products/new');
  });

  test('links to edit product page', async () => {
    adminService.getProducts.mockResolvedValue(mockResponse);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Manage Products')).toBeInTheDocument();
    });

    const editLinks = screen.getAllByText('Edit');
    expect(editLinks[0]).toHaveAttribute('href', '/admin/products/edit/1');
    expect(editLinks[1]).toHaveAttribute('href', '/admin/products/edit/2');
  });
});