import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../../test/test-utils';
import { vi } from 'vitest';
import AdminFlashOrderDetailsPage from '../AdminFlashOrderDetailsPage';
import * as adminService from '../../services/adminService';

vi.mock('../../services/adminService');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'fo1' })
  };
});

const mockOrder = {
  _id: 'fo1',
  orderNumber: 'FLASH-001',
  orderStatus: 'Awaiting_Payment',
  paymentStatus: 'Unpaid',
  basePrice: 25.0,
  returnShipping: 20.0,
  totalPrice: 45.0,
  pixelModel: 'Pixel 8',
  factoryResetConfirmed: true,
  customerEmail: 'cust@test.com',
  createdAt: '2024-01-15T10:00:00Z',
  returnAddress: {
    fullName: 'Jane Smith',
    phoneNumber: '07123456789',
    addressLine1: '1 Main St',
    city: 'London',
    stateProvince: 'England',
    postalCode: 'SW1 1AA',
    country: 'UK'
  },
  statusHistory: [
    { status: 'Awaiting_Payment', timestamp: '2024-01-15T10:00:00Z', note: 'Order created' }
  ]
};

describe('AdminFlashOrderDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);
    adminService.getFlashOrderById.mockResolvedValue({ data: mockOrder });
    adminService.updateFlashOrderStatus.mockResolvedValue({ data: mockOrder });
    adminService.formatCurrency.mockImplementation((amount) => `£${Number(amount).toFixed(2)}`);
  });

  it('redirects to login when not authenticated', () => {
    adminService.isAdminAuthenticated.mockReturnValue(false);

    render(<AdminFlashOrderDetailsPage />);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/login', { replace: true });
  });

  it('shows loading state initially', () => {
    adminService.getFlashOrderById.mockImplementation(() => new Promise(() => {}));

    render(<AdminFlashOrderDetailsPage />);

    expect(screen.getByText('Loading order details...')).toBeInTheDocument();
  });

  it('loads and displays order details', async () => {
    render(<AdminFlashOrderDetailsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('FLASH-001').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
    expect(screen.getByText('cust@test.com')).toBeInTheDocument();
    expect(screen.getByText('Pixel 8')).toBeInTheDocument();
    expect(screen.getByText('£25.00')).toBeInTheDocument();
    expect(screen.getByText('£45.00')).toBeInTheDocument();
    expect(screen.getAllByText('Awaiting Payment').length).toBeGreaterThan(0);
    // Status history note
    expect(screen.getByText('Order created')).toBeInTheDocument();

    expect(document.title).toBe('Flash Order Details - Admin Dashboard');
    expect(adminService.getFlashOrderById).toHaveBeenCalledWith('fo1');
  });

  it('displays error state on API failure', async () => {
    adminService.getFlashOrderById.mockRejectedValue(new Error('Failed to load'));

    render(<AdminFlashOrderDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
      expect(screen.getByText('Back to Flash Orders')).toBeInTheDocument();
    });
  });

  it('shows PO Box locked message when payment not completed', async () => {
    render(<AdminFlashOrderDetailsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('FLASH-001').length).toBeGreaterThan(0);
    });

    expect(
      screen.getByText('PO Box address will be revealed after payment is completed')
    ).toBeInTheDocument();
  });

  it('reveals PO Box address when payment is completed', async () => {
    adminService.getFlashOrderById.mockResolvedValue({
      data: {
        ...mockOrder,
        paymentStatus: 'Completed',
        poBoxAddress: {
          street: 'PO Box 123',
          city: 'London',
          postalCode: 'SW1 1AA',
          country: 'UK',
          instructions: 'Leave at desk'
        }
      }
    });

    render(<AdminFlashOrderDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('PO Box 123')).toBeInTheDocument();
      expect(screen.getByText('Leave at desk')).toBeInTheDocument();
    });
  });

  it('opens status modal and updates order status successfully', async () => {
    render(<AdminFlashOrderDetailsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('FLASH-001').length).toBeGreaterThan(0);
    });

    // Click the header Update Status button
    const updateButtons = screen.getAllByText('Update Status');
    fireEvent.click(updateButtons[0]);

    // Modal appears
    expect(screen.getByText('Update Order Status')).toBeInTheDocument();

    // Change order status select
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Paid' } });

    // Submit the form — modal submit is the last "Update Status" button
    const submitButtons = screen.getAllByRole('button', { name: 'Update Status' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(adminService.updateFlashOrderStatus).toHaveBeenCalledWith(
        'fo1',
        expect.objectContaining({ orderStatus: 'Paid' })
      );
    });
  });

  it('shows no-changes error when nothing changed', async () => {
    render(<AdminFlashOrderDetailsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('FLASH-001').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText('Update Status')[0]);

    // Submit without changes — modal submit is the last "Update Status" button
    const submitButtons = screen.getAllByRole('button', { name: 'Update Status' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('No changes to update')).toBeInTheDocument();
    });
  });

  it('cancels status modal', async () => {
    render(<AdminFlashOrderDetailsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('FLASH-001').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText('Update Status')[0]);
    expect(screen.getByText('Update Order Status')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('Update Order Status')).not.toBeInTheDocument();
    });
  });
});
