import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminOrdersListPage from '../AdminOrdersListPage';
import * as adminService from '../../services/adminService';

// Mock the admin service
vi.mock('../../services/adminService');

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock Pagination component
vi.mock('../../components/Pagination', () => ({
  default: function MockPagination({ currentPage, totalPages, onPageChange }) {
    return (
      <div data-testid="pagination">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          data-testid="prev-page"
        >
          Previous
        </button>
        <span data-testid="current-page">{currentPage}</span>
        <span data-testid="total-pages">{totalPages}</span>
        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          data-testid="next-page"
        >
          Next
        </button>
      </div>
    );
  }
}));

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <AdminOrdersListPage />
    </BrowserRouter>
  );
};

const mockOrdersResponse = {
  data: {
    orders: [
      {
        _id: 'order1',
        orderNumber: 'ORD-001',
        status: 'pending',
        totalAmount: 999.99,
        createdAt: '2024-01-15T10:00:00Z',
        customer: {
          _id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com'
        }
      },
      {
        _id: 'order2',
        orderNumber: 'ORD-002',
        status: 'shipped',
        totalAmount: 1299.99,
        createdAt: '2024-01-20T14:30:00Z',
        customer: {
          _id: 'user2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@test.com'
        }
      }
    ],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalOrders: 2,
      hasNextPage: false,
      hasPrevPage: false,
      limit: 20
    }
  }
};

describe('AdminOrdersListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);
    adminService.getAllOrders.mockResolvedValue(mockOrdersResponse);
    adminService.formatCurrency.mockImplementation((amount) => `£${amount.toFixed(2)}`);
    adminService.formatNumber.mockImplementation((num) => num.toLocaleString());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Authentication', () => {
    it('should redirect to login if not authenticated', async () => {
      adminService.isAdminAuthenticated.mockReturnValue(false);

      renderComponent();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/login', { replace: true });
      });
    });

    it('should not redirect if authenticated', async () => {
      adminService.isAdminAuthenticated.mockReturnValue(true);

      renderComponent();

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Initial Load', () => {
    it('should show loading spinner initially', () => {
      adminService.getAllOrders.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderComponent();

      expect(screen.getByText('Loading orders...')).toBeInTheDocument();
    });

    it('should load and display orders', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
        expect(screen.getByText('ORD-002')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      expect(adminService.getAllOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        status: 'all',
        customerQuery: '',
        startDate: '',
        endDate: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    });

    it('should display error message on API failure', async () => {
      const errorMessage = 'Failed to fetch orders';
      adminService.getAllOrders.mockRejectedValue(new Error(errorMessage));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Orders Table', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });
    });

    it('should display order information correctly', () => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@test.com')).toBeInTheDocument();
      expect(screen.getByText('£999.99')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should show View Details links', () => {
      const viewDetailsLinks = screen.getAllByText('View Details');
      expect(viewDetailsLinks).toHaveLength(2);
      
      expect(viewDetailsLinks[0].closest('a')).toHaveAttribute('href', '/admin/orders/order1');
      expect(viewDetailsLinks[1].closest('a')).toHaveAttribute('href', '/admin/orders/order2');
    });

    it('should format status badges correctly', () => {
      const pendingBadge = screen.getByText('Pending');
      const shippedBadge = screen.getByText('Shipped');
      
      expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
      expect(shippedBadge).toHaveClass('bg-green-100', 'text-green-800');
    });
  });

  describe('Filtering', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });
      vi.clearAllMocks();
    });

    it('should filter by status', async () => {
      const statusSelect = screen.getByDisplayValue('All Statuses');
      fireEvent.change(statusSelect, { target: { value: 'pending' } });

      await waitFor(() => {
        expect(adminService.getAllOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'pending',
            page: 1
          })
        );
      });
    });

    it('should filter by customer query', async () => {
      const customerInput = screen.getByPlaceholderText('Search by name or email...');
      fireEvent.change(customerInput, { target: { value: 'john' } });

      await waitFor(() => {
        expect(adminService.getAllOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            customerQuery: 'john',
            page: 1
          })
        );
      });
    });

    it('should filter by date range', async () => {
      const startDateInput = screen.getByLabelText('From Date');
      const endDateInput = screen.getByLabelText('To Date');
      
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });

      await waitFor(() => {
        expect(adminService.getAllOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            page: 1
          })
        );
      });
    });

    it('should clear all filters', async () => {
      // Set some filters first
      const statusSelect = screen.getByDisplayValue('All Statuses');
      fireEvent.change(statusSelect, { target: { value: 'pending' } });

      const customerInput = screen.getByPlaceholderText('Search by name or email...');
      fireEvent.change(customerInput, { target: { value: 'john' } });

      // Clear filters
      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(adminService.getAllOrders).toHaveBeenCalledWith({
          page: 1,
          limit: 20,
          status: 'all',
          customerQuery: '',
          startDate: '',
          endDate: '',
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
      });

      expect(statusSelect.value).toBe('all');
      expect(customerInput.value).toBe('');
    });
  });

  describe('Sorting', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });
      vi.clearAllMocks();
    });

    it('should sort by order date when clicking column header', async () => {
      const orderDateHeader = screen.getByText('Order Date').closest('th');
      fireEvent.click(orderDateHeader);

      await waitFor(() => {
        expect(adminService.getAllOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'createdAt',
            sortOrder: 'asc', // Should toggle from default desc to asc
            page: 1
          })
        );
      });
    });

    it('should sort by total amount when clicking column header', async () => {
      const totalHeader = screen.getByText('Total').closest('th');
      fireEvent.click(totalHeader);

      await waitFor(() => {
        expect(adminService.getAllOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'totalAmount',
            sortOrder: 'desc',
            page: 1
          })
        );
      });
    });

    it('should toggle sort order when clicking same column twice', async () => {
      const totalHeader = screen.getByText('Total').closest('th');
      
      // First click
      fireEvent.click(totalHeader);
      await waitFor(() => {
        expect(adminService.getAllOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'totalAmount',
            sortOrder: 'desc'
          })
        );
      });

      jest.clearAllMocks();

      // Second click
      fireEvent.click(totalHeader);
      await waitFor(() => {
        expect(adminService.getAllOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'totalAmount',
            sortOrder: 'asc'
          })
        );
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination when multiple pages exist', async () => {
      const mockResponseWithPagination = {
        ...mockOrdersResponse,
        data: {
          ...mockOrdersResponse.data,
          pagination: {
            currentPage: 1,
            totalPages: 3,
            totalOrders: 45,
            hasNextPage: true,
            hasPrevPage: false,
            limit: 20
          }
        }
      };

      adminService.getAllOrders.mockResolvedValue(mockResponseWithPagination);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
      });
    });

    it('should handle page changes', async () => {
      const mockResponseWithPagination = {
        ...mockOrdersResponse,
        data: {
          ...mockOrdersResponse.data,
          pagination: {
            currentPage: 1,
            totalPages: 3,
            totalOrders: 45,
            hasNextPage: true,
            hasPrevPage: false,
            limit: 20
          }
        }
      };

      adminService.getAllOrders.mockResolvedValue(mockResponseWithPagination);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
      });

      jest.clearAllMocks();

      const nextButton = screen.getByTestId('next-page');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(adminService.getAllOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2
          })
        );
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no orders exist', async () => {
      const emptyResponse = {
        data: {
          orders: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalOrders: 0,
            hasNextPage: false,
            hasPrevPage: false,
            limit: 20
          }
        }
      };

      adminService.getAllOrders.mockResolvedValue(emptyResponse);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No orders found')).toBeInTheDocument();
        expect(screen.getByText('No orders have been placed yet.')).toBeInTheDocument();
      });
    });

    it('should show different message when filters are applied but no results', async () => {
      const emptyResponse = {
        data: {
          orders: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalOrders: 0,
            hasNextPage: false,
            hasPrevPage: false,
            limit: 20
          }
        }
      };

      adminService.getAllOrders.mockResolvedValue(emptyResponse);

      renderComponent();

      // Apply a filter
      await waitFor(() => {
        expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue('All Statuses');
      fireEvent.change(statusSelect, { target: { value: 'pending' } });

      await waitFor(() => {
        expect(screen.getByText('No orders found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your filters to see more results.')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });
    });

    it('should have back to dashboard link', () => {
      const backLink = screen.getByText('← Back to Dashboard');
      expect(backLink.closest('a')).toHaveAttribute('href', '/admin');
    });

    it('should set correct page title', () => {
      expect(document.title).toBe('Manage Orders - Admin Dashboard');
    });
  });
});