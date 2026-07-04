import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../../test/test-utils';
import { vi } from 'vitest';
import AdminFlashOrdersListPage from '../AdminFlashOrdersListPage';
import * as adminService from '../../services/adminService';

vi.mock('../../services/adminService');
vi.mock('../../components/Pagination', () => ({
  default: function MockPagination({ currentPage, totalPages, onPageChange }) {
    return (
      <div data-testid="pagination">
        <button onClick={() => onPageChange(currentPage + 1)} data-testid="next-page">Next</button>
        <span data-testid="total-pages">{totalPages}</span>
      </div>
    );
  }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const mockOrder = {
  _id: 'fo1',
  orderNumber: 'FLASH-001',
  orderStatus: 'Awaiting_Payment',
  paymentStatus: 'Unpaid',
  totalPrice: 45.0,
  pixelModel: 'Pixel 8',
  customerEmail: 'cust@test.com',
  returnAddress: { fullName: 'Jane Smith' },
  createdAt: '2024-01-15T10:00:00Z'
};

const mockResponse = {
  data: {
    orders: [mockOrder],
    pagination: { page: 1, pages: 1, total: 1 }
  }
};

describe('AdminFlashOrdersListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);
    adminService.getAllFlashOrders.mockResolvedValue(mockResponse);
    adminService.formatCurrency.mockImplementation((amount) => `£${Number(amount).toFixed(2)}`);
  });

  it('redirects to login when not authenticated', () => {
    adminService.isAdminAuthenticated.mockReturnValue(false);

    render(<AdminFlashOrdersListPage />);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/login', { replace: true });
  });

  it('shows loading state initially', () => {
    adminService.getAllFlashOrders.mockImplementation(() => new Promise(() => {}));

    render(<AdminFlashOrdersListPage />);

    expect(screen.getByText('Loading flash orders...')).toBeInTheDocument();
  });

  it('loads and displays flash orders', async () => {
    render(<AdminFlashOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('FLASH-001')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Pixel 8')).toBeInTheDocument();
      expect(screen.getByText('£45.00')).toBeInTheDocument();
    });

    const detailsLink = screen.getByText('View Details').closest('a');
    expect(detailsLink).toHaveAttribute('href', '/admin/flash-orders/fo1');

    expect(screen.getByText('Flash Orders')).toBeInTheDocument();
    expect(document.title).toBe('Manage Flash Orders - Admin Dashboard');
  });

  it('displays error message on API failure', async () => {
    adminService.getAllFlashOrders.mockRejectedValue(new Error('Failed to load'));

    render(<AdminFlashOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('shows empty state when no orders', async () => {
    adminService.getAllFlashOrders.mockResolvedValue({
      data: { orders: [], pagination: { total: 0 } }
    });

    render(<AdminFlashOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('No flash orders found')).toBeInTheDocument();
    });
  });

  it('filters by status', async () => {
    render(<AdminFlashOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('FLASH-001')).toBeInTheDocument();
    });
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);

    fireEvent.change(screen.getByDisplayValue('All Statuses'), { target: { value: 'Paid' } });

    await waitFor(() => {
      expect(adminService.getAllFlashOrders).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Paid', page: 1 })
      );
    });
  });

  it('filters by customer query', async () => {
    render(<AdminFlashOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('FLASH-001')).toBeInTheDocument();
    });
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);

    fireEvent.change(screen.getByPlaceholderText('Email, order number...'), {
      target: { value: 'cust' }
    });

    await waitFor(() => {
      expect(adminService.getAllFlashOrders).toHaveBeenCalledWith(
        expect.objectContaining({ customerQuery: 'cust', page: 1 })
      );
    });
  });

  it('clears filters', async () => {
    render(<AdminFlashOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('FLASH-001')).toBeInTheDocument();
    });
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);

    fireEvent.click(screen.getByText('Clear Filters'));

    await waitFor(() => {
      expect(adminService.getAllFlashOrders).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'all', customerQuery: '' })
      );
    });
  });

  it('renders pagination when multiple pages', async () => {
    adminService.getAllFlashOrders.mockResolvedValue({
      data: { orders: [mockOrder], pagination: { page: 1, pages: 3, total: 45 } }
    });

    render(<AdminFlashOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);

    fireEvent.click(screen.getByTestId('next-page'));

    await waitFor(() => {
      expect(adminService.getAllFlashOrders).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it('sorts when clicking a sortable column header', async () => {
    render(<AdminFlashOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('FLASH-001')).toBeInTheDocument();
    });
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);

    fireEvent.click(screen.getByText('Total').closest('th'));

    await waitFor(() => {
      expect(adminService.getAllFlashOrders).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'totalPrice', sortOrder: 'desc', page: 1 })
      );
    });
  });
});
