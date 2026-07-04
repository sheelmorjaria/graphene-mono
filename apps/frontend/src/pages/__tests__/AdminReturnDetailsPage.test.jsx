import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../../test/test-utils';
import { vi } from 'vitest';
import AdminReturnDetailsPage from '../AdminReturnDetailsPage';
import * as adminService from '../../services/adminService';

vi.mock('../../services/adminService');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ returnRequestId: 'ret1' })
  };
});

const mockReturnRequest = {
  _id: 'ret1',
  returnRequestNumber: '00123',
  status: 'pending_review',
  totalRefundAmount: 199.99,
  requestDate: '2024-01-15T10:00:00Z',
  isWithinReturnWindow: true,
  returnWindow: 14,
  customer: { firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
  order: { _id: 'ord1', orderNumber: 'ORD-001' },
  items: [
    {
      productName: 'Pixel 8',
      quantity: 1,
      unitPrice: 199.99,
      totalRefundAmount: 199.99,
      reason: 'defective',
      reasonDescription: 'Screen issue'
    }
  ],
  returnShippingAddress: {
    companyName: 'Returns Co',
    addressLine1: '1 Main St',
    city: 'London',
    stateProvince: 'England',
    postalCode: 'SW1 1AA',
    country: 'UK'
  }
};

describe('AdminReturnDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getReturnRequestById.mockResolvedValue({
      data: { returnRequest: mockReturnRequest }
    });
    adminService.updateReturnRequestStatus.mockResolvedValue({
      data: { returnRequest: { ...mockReturnRequest, status: 'approved' } }
    });
    adminService.formatCurrency.mockImplementation((amount) => `£${Number(amount).toFixed(2)}`);
  });

  it('shows loading state initially', () => {
    adminService.getReturnRequestById.mockImplementation(() => new Promise(() => {}));

    render(<AdminReturnDetailsPage />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('loads and displays return request details', async () => {
    render(<AdminReturnDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Return Request RET-00123')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
    expect(screen.getByText('£199.99')).toBeInTheDocument();
    expect(screen.getByText('Pixel 8')).toBeInTheDocument();
    expect(screen.getByText(/Screen issue/)).toBeInTheDocument();
    // Return Address section heading is present
    expect(screen.getByText('Return Address')).toBeInTheDocument();
    expect(screen.getByText(/Within window/)).toBeInTheDocument();

    expect(adminService.getReturnRequestById).toHaveBeenCalledWith('ret1');
  });

  it('displays error state on API failure', async () => {
    adminService.getReturnRequestById.mockRejectedValue(new Error('Failed to fetch'));

    render(<AdminReturnDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
      expect(screen.getByText('← Back to Return Requests')).toBeInTheDocument();
    });
  });

  it('opens status modal, selects status, and updates successfully', async () => {
    render(<AdminReturnDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Return Request RET-00123')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Update Status')[0]);

    // Modal appears
    expect(screen.getByText('Update Return Status')).toBeInTheDocument();

    const statusSelect = screen.getByLabelText('New Status');
    fireEvent.change(statusSelect, { target: { value: 'approved' } });

    const updateButtons = screen.getAllByText('Update Status');
    fireEvent.click(updateButtons[updateButtons.length - 1]);

    await waitFor(() => {
      expect(adminService.updateReturnRequestStatus).toHaveBeenCalledWith(
        'ret1',
        expect.objectContaining({ newStatus: 'approved' })
      );
    });
  });

  it('requires rejection reason when rejecting', async () => {
    render(<AdminReturnDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Return Request RET-00123')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Update Status'));

    const statusSelect = screen.getByLabelText('New Status');
    fireEvent.change(statusSelect, { target: { value: 'rejected' } });

    // Rejection reason field appears
    expect(screen.getByLabelText('Rejection Reason *')).toBeInTheDocument();

    // Update button disabled without reason
    const updateButtons = screen.getAllByText('Update Status');
    const modalUpdateButton = updateButtons[updateButtons.length - 1];
    expect(modalUpdateButton).toBeDisabled();

    // Provide reason
    fireEvent.change(screen.getByLabelText('Rejection Reason *'), { target: { value: 'Invalid' } });

    fireEvent.click(modalUpdateButton);

    await waitFor(() => {
      expect(adminService.updateReturnRequestStatus).toHaveBeenCalledWith(
        'ret1',
        expect.objectContaining({ newStatus: 'rejected', rejectionReason: 'Invalid' })
      );
    });
  });

  it('cancels status modal', async () => {
    render(<AdminReturnDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Return Request RET-00123')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Update Status'));
    expect(screen.getByText('Update Return Status')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('Update Return Status')).not.toBeInTheDocument();
    });
  });

  it('navigates to order refund when approved and Issue Refund clicked', async () => {
    adminService.getReturnRequestById.mockResolvedValue({
      data: { returnRequest: { ...mockReturnRequest, status: 'approved' } }
    });

    render(<AdminReturnDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Issue Refund')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Issue Refund'));

    expect(mockNavigate).toHaveBeenCalledWith(
      '/admin/orders/ord1',
      { state: { showRefundModal: true, returnRequestId: 'ret1' } }
    );
  });
});
