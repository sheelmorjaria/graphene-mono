import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../../test/test-utils';
import { vi } from 'vitest';
import AdminReturnsListPage from '../AdminReturnsListPage';
import * as adminService from '../../services/adminService';

vi.mock('../../services/adminService');

const mockReturnRequest = {
  _id: 'ret1',
  returnRequestNumber: 'RET-00123',
  status: 'pending_review',
  totalRefundAmount: 199.99,
  totalItemsCount: 2,
  requestDate: '2024-01-15T10:00:00Z',
  customer: { _id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
  order: { _id: 'o1', orderNumber: 'ORD-001' }
};

const mockResponse = {
  data: {
    returnRequests: [mockReturnRequest],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalReturnRequests: 1,
      hasNextPage: false,
      hasPrevPage: false,
      limit: 20
    }
  }
};

describe('AdminReturnsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getAllReturnRequests.mockResolvedValue(mockResponse);
    adminService.formatCurrency.mockImplementation((amount) => `£${Number(amount).toFixed(2)}`);
  });

  it('shows loading state initially', () => {
    adminService.getAllReturnRequests.mockImplementation(() => new Promise(() => {}));

    render(
        <AdminReturnsListPage />

    );

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('loads and displays return requests', async () => {
    render(
        <AdminReturnsListPage />

    );

    await waitFor(() => {
      expect(screen.getByText('RET-RET-00123')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(/Order: ORD-001/)).toBeInTheDocument();
      expect(screen.getByText('£199.99')).toBeInTheDocument();
    });

    // Link to details
    const detailsLink = screen.getByText('RET-RET-00123').closest('a');
    expect(detailsLink).toHaveAttribute('href', '/admin/returns/ret1');

    expect(adminService.getAllReturnRequests).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20, status: '' })
    );
  });

  it('displays error message on API failure', async () => {
    adminService.getAllReturnRequests.mockRejectedValue(new Error('Failed to fetch'));

    render(
        <AdminReturnsListPage />

    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });

  it('shows empty state when no return requests', async () => {
    adminService.getAllReturnRequests.mockResolvedValue({
      data: { returnRequests: [], pagination: { totalReturnRequests: 0 } }
    });

    render(
        <AdminReturnsListPage />

    );

    await waitFor(() => {
      expect(screen.getByText('No return requests found.')).toBeInTheDocument();
    });
  });

  it('filters by status', async () => {
    render(
        <AdminReturnsListPage />

    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    vi.clearAllMocks();

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'approved' } });

    await waitFor(() => {
      expect(adminService.getAllReturnRequests).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'approved', page: 1 })
      );
    });
  });

  it('filters by customer query', async () => {
    render(
        <AdminReturnsListPage />

    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    vi.clearAllMocks();

    fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'john' } });

    await waitFor(() => {
      expect(adminService.getAllReturnRequests).toHaveBeenCalledWith(
        expect.objectContaining({ customerQuery: 'john', page: 1 })
      );
    });
  });

  it('clears filters', async () => {
    render(
        <AdminReturnsListPage />

    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText('Status');
    fireEvent.change(statusSelect, { target: { value: 'approved' } });

    // Wait for the status-change re-fetch to settle so the list re-renders
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    vi.clearAllMocks();
    adminService.getAllReturnRequests.mockResolvedValue(mockResponse);
    adminService.formatCurrency.mockImplementation((amount) => `£${Number(amount).toFixed(2)}`);

    fireEvent.click(screen.getByText('Clear Filters'));

    await waitFor(() => {
      expect(adminService.getAllReturnRequests).toHaveBeenCalledWith(
        expect.objectContaining({ status: '', customerQuery: '' })
      );
    });
  });

  it('renders pagination when multiple pages exist', async () => {
    const pagedResponse = {
      data: {
        returnRequests: [mockReturnRequest],
        pagination: {
          currentPage: 1,
          totalPages: 2,
          totalReturnRequests: 25,
          hasNextPage: true,
          hasPrevPage: false,
          limit: 20
        }
      }
    };
    adminService.getAllReturnRequests.mockResolvedValue(pagedResponse);

    render(
        <AdminReturnsListPage />

    );

    await waitFor(() => {
      expect(screen.getAllByText('Next')).toHaveLength(2);
    });

    vi.clearAllMocks();
    fireEvent.click(screen.getAllByText('Next')[0]);

    await waitFor(() => {
      expect(adminService.getAllReturnRequests).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });
});
