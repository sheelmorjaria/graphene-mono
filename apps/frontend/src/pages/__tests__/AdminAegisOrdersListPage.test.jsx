import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../../test/test-utils';
import { vi } from 'vitest';
import AdminAegisOrdersListPage from '../AdminAegisOrdersListPage';
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
  _id: 'ao1',
  orderNumber: 'AEG-001',
  orderStatus: 'Paid',
  paymentStatus: 'Completed',
  amountGbp: 99.00,
  pixelModel: '7 Pro',
  customerEmail: 'cust@test.com',
  createdAt: '2024-01-15T10:00:00Z'
};

const mockResponse = {
  data: {
    orders: [mockOrder],
    pagination: { page: 1, pages: 1, total: 1 }
  }
};

describe('AdminAegisOrdersListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);
    adminService.getAllAegisOrders.mockResolvedValue(mockResponse);
    adminService.formatCurrency.mockImplementation((amount) => `£${Number(amount).toFixed(2)}`);
  });

  it('redirects to login when not authenticated', () => {
    adminService.isAdminAuthenticated.mockReturnValue(false);

    render(<AdminAegisOrdersListPage />);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/login', { replace: true });
  });

  it('shows loading state initially', () => {
    adminService.getAllAegisOrders.mockImplementation(() => new Promise(() => {}));

    render(<AdminAegisOrdersListPage />);

    expect(screen.getByText('Loading Aegis orders...')).toBeInTheDocument();
  });

  it('loads and displays Aegis orders', async () => {
    render(<AdminAegisOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('AEG-001')).toBeInTheDocument();
      expect(screen.getByText('cust@test.com')).toBeInTheDocument();
      expect(screen.getByText('Pixel 7 Pro')).toBeInTheDocument();
      expect(screen.getByText('£99.00')).toBeInTheDocument();
    });

    const detailsLink = screen.getByText('View Details').closest('a');
    expect(detailsLink).toHaveAttribute('href', '/admin/aegis-orders/ao1');

    expect(document.title).toBe('Manage Aegis Orders - Admin Dashboard');
  });

  it('displays error message on API failure', async () => {
    adminService.getAllAegisOrders.mockRejectedValue(new Error('Failed to load'));

    render(<AdminAegisOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('shows empty state when no orders', async () => {
    adminService.getAllAegisOrders.mockResolvedValue({
      data: { orders: [], pagination: { total: 0 } }
    });

    render(<AdminAegisOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('No Aegis orders found')).toBeInTheDocument();
    });
  });

  it('filters by status', async () => {
    render(<AdminAegisOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('AEG-001')).toBeInTheDocument();
    });
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);

    fireEvent.change(screen.getByDisplayValue('All Statuses'), { target: { value: 'Paid' } });

    await waitFor(() => {
      expect(adminService.getAllAegisOrders).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Paid', page: 1 })
      );
    });
  });

  it('filters by customer query', async () => {
    render(<AdminAegisOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('AEG-001')).toBeInTheDocument();
    });
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);

    fireEvent.change(screen.getByPlaceholderText('Email, order number, model...'), {
      target: { value: 'cust' }
    });

    await waitFor(() => {
      expect(adminService.getAllAegisOrders).toHaveBeenCalledWith(
        expect.objectContaining({ customerQuery: 'cust', page: 1 })
      );
    });
  });

  it('renders pagination when multiple pages', async () => {
    adminService.getAllAegisOrders.mockResolvedValue({
      data: { orders: [mockOrder], pagination: { page: 1, pages: 3, total: 45 } }
    });

    render(<AdminAegisOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);

    fireEvent.click(screen.getByTestId('next-page'));

    await waitFor(() => {
      expect(adminService.getAllAegisOrders).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it('sorts when clicking a sortable column header', async () => {
    render(<AdminAegisOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByText('AEG-001')).toBeInTheDocument();
    });
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);

    fireEvent.click(screen.getByText('Amount').closest('th'));

    await waitFor(() => {
      expect(adminService.getAllAegisOrders).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'amountGbp', sortOrder: 'desc', page: 1 })
      );
    });
  });
});
