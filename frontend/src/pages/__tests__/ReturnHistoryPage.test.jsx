import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ReturnHistoryPage from '../ReturnHistoryPage';
import * as returnService from '../../services/returnService';

// Mock the return service
vi.mock('../../services/returnService');

// Mock router
const MockRouter = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ReturnHistoryPage', () => {
  const mockReturnRequests = [
    {
      id: 'return1',
      returnRequestNumber: '20241201001',
      formattedRequestNumber: 'RET-20241201001',
      orderNumber: 'ORD-123456',
      orderId: 'order1',
      status: 'pending_review',
      totalRefundAmount: 599,
      totalItemsCount: 1,
      requestDate: '2024-12-01T10:00:00Z',
      createdAt: '2024-12-01T10:00:00Z',
      updatedAt: '2024-12-01T10:00:00Z'
    },
    {
      id: 'return2',
      returnRequestNumber: '20241125001',
      formattedRequestNumber: 'RET-20241125001',
      orderNumber: 'ORD-789012',
      orderId: 'order2',
      status: 'refunded',
      totalRefundAmount: 399,
      totalItemsCount: 2,
      requestDate: '2024-11-25T14:30:00Z',
      createdAt: '2024-11-25T14:30:00Z',
      updatedAt: '2024-11-28T16:45:00Z'
    }
  ];

  const mockPagination = {
    page: 1,
    limit: 10,
    total: 2,
    pages: 1
  };

  beforeEach(() => {
    vi.clearAllMocks();
    returnService.getUserReturnRequests.mockResolvedValue({
      data: mockReturnRequests,
      pagination: mockPagination
    });
  });

  it('renders return history page correctly', async () => {
    render(
      <MockRouter>
        <ReturnHistoryPage />
      </MockRouter>
    );

    expect(screen.getByText('My Returns')).toBeInTheDocument();
    expect(screen.getByText('Track and manage your return requests')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('RET-20241201001')).toBeInTheDocument();
      expect(screen.getByText('RET-20241125001')).toBeInTheDocument();
    });
  });

  it('displays return request information correctly', async () => {
    render(
      <MockRouter>
        <ReturnHistoryPage />
      </MockRouter>
    );

    await waitFor(() => {
      // Check first return request
      expect(screen.getByText('RET-20241201001')).toBeInTheDocument();
      expect(screen.getByText('ORD-123456')).toBeInTheDocument();
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
      expect(screen.getByText('1 item(s)')).toBeInTheDocument();
      expect(screen.getByText('£599.00')).toBeInTheDocument();

      // Check second return request
      expect(screen.getByText('RET-20241125001')).toBeInTheDocument();
      expect(screen.getByText('ORD-789012')).toBeInTheDocument();
      expect(screen.getByText('Refunded')).toBeInTheDocument();
      expect(screen.getByText('2 item(s)')).toBeInTheDocument();
      expect(screen.getByText('£399.00')).toBeInTheDocument();
    });
  });

  it('handles status filter change', async () => {
    render(
      <MockRouter>
        <ReturnHistoryPage />
      </MockRouter>
    );

    await waitFor(() => {
      expect(returnService.getUserReturnRequests).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'requestDate',
        sortOrder: 'desc'
      });
    });

    // Change status filter
    const statusFilter = screen.getByLabelText('Filter by Status');
    fireEvent.change(statusFilter, { target: { value: 'refunded' } });

    await waitFor(() => {
      expect(returnService.getUserReturnRequests).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'requestDate',
        sortOrder: 'desc',
        status: 'refunded'
      });
    });
  });

  it('displays empty state when no return requests exist', async () => {
    returnService.getUserReturnRequests.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 }
    });

    render(
      <MockRouter>
        <ReturnHistoryPage />
      </MockRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No Return Requests')).toBeInTheDocument();
      expect(screen.getByText("You haven't submitted any return requests yet.")).toBeInTheDocument();
    });
  });

  it('displays filtered empty state message', async () => {
    returnService.getUserReturnRequests.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 }
    });

    render(
      <MockRouter>
        <ReturnHistoryPage />
      </MockRouter>
    );

    // Set status filter first
    const statusFilter = screen.getByLabelText('Filter by Status');
    fireEvent.change(statusFilter, { target: { value: 'approved' } });

    await waitFor(() => {
      expect(screen.getByText('No return requests found with status "Approved"')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    const errorMessage = 'Failed to fetch return requests';
    returnService.getUserReturnRequests.mockRejectedValue(new Error(errorMessage));

    render(
      <MockRouter>
        <ReturnHistoryPage />
      </MockRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('renders pagination when multiple pages exist', async () => {
    const mockPaginationMultiple = {
      page: 1,
      limit: 10,
      total: 25,
      pages: 3
    };

    returnService.getUserReturnRequests.mockResolvedValue({
      data: mockReturnRequests,
      pagination: mockPaginationMultiple
    });

    render(
      <MockRouter>
        <ReturnHistoryPage />
      </MockRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('handles page navigation', async () => {
    const mockPaginationMultiple = {
      page: 1,
      limit: 10,
      total: 25,
      pages: 3
    };

    returnService.getUserReturnRequests.mockResolvedValue({
      data: mockReturnRequests,
      pagination: mockPaginationMultiple
    });

    render(
      <MockRouter>
        <ReturnHistoryPage />
      </MockRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    // Click page 2
    fireEvent.click(screen.getByText('2'));

    await waitFor(() => {
      expect(returnService.getUserReturnRequests).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        sortBy: 'requestDate',
        sortOrder: 'desc'
      });
    });
  });

  it('displays correct item count in pagination info', async () => {
    const mockPaginationMultiple = {
      page: 2,
      limit: 10,
      total: 25,
      pages: 3
    };

    returnService.getUserReturnRequests.mockResolvedValue({
      data: mockReturnRequests,
      pagination: mockPaginationMultiple
    });

    render(
      <MockRouter>
        <ReturnHistoryPage />
      </MockRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Showing 11 - 20 of 25 returns')).toBeInTheDocument();
    });
  });

  it('renders view details and view order links', async () => {
    render(
      <MockRouter>
        <ReturnHistoryPage />
      </MockRouter>
    );

    await waitFor(() => {
      const viewDetailsLinks = screen.getAllByText('View Details');
      const viewOrderLinks = screen.getAllByText('View Order');
      
      expect(viewDetailsLinks).toHaveLength(2);
      expect(viewOrderLinks).toHaveLength(2);
      
      expect(viewDetailsLinks[0].closest('a')).toHaveAttribute('href', '/my-account/returns/return1');
      expect(viewOrderLinks[0].closest('a')).toHaveAttribute('href', '/orders/order1');
    });
  });
});