import React from 'react';
import { render, screen, waitFor, userEvent } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MyOrdersPage from '../MyOrdersPage';

// Mock orderService
vi.mock('../../services/orderService', () => ({
  getUserOrders: vi.fn(),
  formatCurrency: vi.fn(amount => `£${amount.toFixed(2)}`),
  getStatusColor: vi.fn(() => '#00ff00')
}));

import { getUserOrders } from '../../services/orderService';

const makeOrder = (overrides = {}) => ({
  _id: 'order-1',
  orderNumber: 'ORD-1001',
  formattedDate: '01 Jan 2026',
  status: 'processing',
  statusDisplay: 'Processing',
  totalAmount: 599.99,
  itemCount: 2,
  ...overrides
});

describe('MyOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    getUserOrders.mockReturnValue(new Promise(() => {}));
    render(<MyOrdersPage />);

    expect(screen.getByText('Loading your orders...')).toBeInTheDocument();
  });

  it('shows empty state when no orders', async () => {
    getUserOrders.mockResolvedValue({ data: { orders: [], pagination: {} } });
    render(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('No Orders Yet')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /start shopping/i })).toHaveAttribute('href', '/products');
  });

  it('renders the orders list on success', async () => {
    const orders = [
      makeOrder({ _id: 'o1', orderNumber: 'ORD-1001' }),
      makeOrder({ _id: 'o2', orderNumber: 'ORD-1002' })
    ];
    getUserOrders.mockResolvedValue({
      data: {
        orders,
        pagination: { totalPages: 1, totalOrders: 2, limit: 10, hasPrevPage: false, hasNextPage: false }
      }
    });
    render(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getAllByText('ORD-1001')).toHaveLength(2);
    });

    expect(screen.getAllByText('ORD-1002')).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: /view details/i })).toHaveLength(4);
    expect(screen.getByText(/Showing 1 to 2 of 2 orders/i)).toBeInTheDocument();
  });

  it('shows error message when load fails', async () => {
    getUserOrders.mockRejectedValue(new Error('Failed to load orders'));
    render(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load orders');
    });
  });

  it('uses fallback error message when err has no message', async () => {
    getUserOrders.mockRejectedValue({});
    render(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load orders');
    });
  });

  it('sets the document title', async () => {
    getUserOrders.mockResolvedValue({ data: { orders: [], pagination: {} } });
    render(<MyOrdersPage />);

    await waitFor(() => {
      expect(document.title).toBe('My Orders - Graphene Security');
    });
  });

  it('calls getUserOrders with pagination and sort params', async () => {
    getUserOrders.mockResolvedValue({ data: { orders: [], pagination: {} } });
    render(<MyOrdersPage />);

    await waitFor(() => {
      expect(getUserOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'orderDate',
        sortOrder: 'desc'
      });
    });
  });

  it('renders pagination controls when multiple pages', async () => {
    getUserOrders.mockResolvedValue({
      data: {
        orders: [makeOrder()],
        pagination: {
          totalPages: 3,
          totalOrders: 25,
          limit: 10,
          hasPrevPage: false,
          hasNextPage: true
        }
      }
    });
    render(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('changes page when a page number is clicked', async () => {
    getUserOrders.mockResolvedValue({
      data: {
        orders: [makeOrder()],
        pagination: {
          totalPages: 3,
          totalOrders: 25,
          limit: 10,
          hasPrevPage: false,
          hasNextPage: true
        }
      }
    });
    render(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => {
      expect(getUserOrders).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });
  });

  it('toggles sort order when clicking the same sort field', async () => {
    getUserOrders.mockResolvedValue({
      data: {
        orders: [makeOrder()],
        pagination: { totalPages: 1, totalOrders: 1, limit: 10 }
      }
    });
    render(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getAllByText('ORD-1001')).toHaveLength(2);
    });

    // Default sort is orderDate desc (icon ↓)
    await userEvent.click(screen.getByText('Date ↓'));

    await waitFor(() => {
      expect(getUserOrders).toHaveBeenCalledWith(expect.objectContaining({
        sortBy: 'orderDate',
        sortOrder: 'asc'
      }));
    });
  });

  it('switches sort field when clicking a new column', async () => {
    getUserOrders.mockResolvedValue({
      data: {
        orders: [makeOrder()],
        pagination: { totalPages: 1, totalOrders: 1, limit: 10 }
      }
    });
    render(<MyOrdersPage />);

    await waitFor(() => {
      expect(screen.getAllByText('ORD-1001')).toHaveLength(2);
    });

    await userEvent.click(screen.getByText('Status ↕'));

    await waitFor(() => {
      expect(getUserOrders).toHaveBeenCalledWith(expect.objectContaining({
        sortBy: 'status',
        sortOrder: 'desc',
        page: 1
      }));
    });
  });
});
