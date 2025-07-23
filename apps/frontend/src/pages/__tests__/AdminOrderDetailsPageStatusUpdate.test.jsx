import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminOrderDetailsPage from '../AdminOrderDetailsPage';
import * as adminService from '../../services/adminService';

// Mock the admin service
vi.mock('../../services/adminService', () => ({
  getOrderById: vi.fn(),
  isAdminAuthenticated: vi.fn(),
  formatCurrency: vi.fn((amount) => `£${amount}`),
  updateOrderStatus: vi.fn()
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ orderId: 'test-order-id' })
  };
});

const mockOrder = {
  _id: 'test-order-id',
  orderNumber: 'ORD-123456',
  status: 'processing',
  totalAmount: 599.99,
  subtotalAmount: 549.99,
  shippingCost: 50,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  customer: {
    _id: 'customer-id',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+44 1234 567890'
  },
  items: [
    {
      _id: 'item-1',
      productId: 'product-1',
      name: 'Google Pixel 7 Pro',
      slug: 'google-pixel-7-pro',
      price: 549.99,
      quantity: 1,
      image: 'pixel-7-pro.jpg',
      lineTotal: 549.99
    }
  ],
  shippingAddress: {
    firstName: 'John',
    lastName: 'Doe',
    addressLine1: '123 Main Street',
    city: 'London',
    postalCode: 'SW1A 1AA',
    country: 'UK'
  },
  billingAddress: {
    firstName: 'John',
    lastName: 'Doe',
    addressLine1: '123 Main Street',
    city: 'London',
    postalCode: 'SW1A 1AA',
    country: 'UK'
  },
  paymentMethod: { type: 'card', last4: '1234' },
  paymentStatus: 'completed',
  shippingMethod: { name: 'Standard Shipping' },
  statusHistory: [
    {
      status: 'pending',
      timestamp: '2024-01-15T09:00:00Z',
      notes: 'Order created'
    },
    {
      status: 'processing',
      timestamp: '2024-01-15T10:00:00Z',
      notes: 'Order confirmed and being processed'
    }
  ]
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <AdminOrderDetailsPage />
    </BrowserRouter>
  );
};

describe('AdminOrderDetailsPage - Status Update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);
    adminService.getOrderById.mockResolvedValue({
      data: { order: mockOrder }
    });
  });

  describe('Status Update UI', () => {
    test('should display status update section for orders with valid transitions', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Update Order Status')).toBeInTheDocument();
      });

      // Should show dropdown with valid next statuses
      const statusSelect = screen.getByLabelText('New Status');
      expect(statusSelect).toBeInTheDocument();
      
      // Processing order can go to: awaiting_shipment, shipped, cancelled
      expect(screen.getByText('Awaiting Shipment')).toBeInTheDocument();
      expect(screen.getByText('Shipped')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    test('should not display status update section for final statuses', async () => {
      const deliveredOrder = { ...mockOrder, status: 'delivered' };
      adminService.getOrderById.mockResolvedValue({
        data: { order: deliveredOrder }
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Order Summary')).toBeInTheDocument();
      });

      // Should not show status update section for delivered orders
      expect(screen.queryByText('Update Order Status')).not.toBeInTheDocument();
    });

    test('should show tracking fields when shipped status is selected', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Update Order Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('New Status');
      fireEvent.change(statusSelect, { target: { value: 'shipped' } });

      // Should show tracking fields
      expect(screen.getByLabelText('Tracking Number *')).toBeInTheDocument();
      expect(screen.getByLabelText('Tracking URL *')).toBeInTheDocument();
    });

    test('should hide tracking fields when non-shipped status is selected', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Update Order Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('New Status');
      
      // First select shipped to show tracking fields
      fireEvent.change(statusSelect, { target: { value: 'shipped' } });
      expect(screen.getByLabelText('Tracking Number *')).toBeInTheDocument();

      // Then select awaiting_shipment to hide tracking fields
      fireEvent.change(statusSelect, { target: { value: 'awaiting_shipment' } });
      expect(screen.queryByLabelText('Tracking Number *')).not.toBeInTheDocument();
    });
  });

  describe('Status Update Confirmation', () => {
    test('should show confirmation dialog when update button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Update Order Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('New Status');
      fireEvent.change(statusSelect, { target: { value: 'awaiting_shipment' } });

      const updateButton = screen.getByText('Update Status');
      fireEvent.click(updateButton);

      // Should show confirmation dialog
      expect(screen.getByText('Confirm Status Update')).toBeInTheDocument();
      expect(screen.getByText(/change the order status to.*Awaiting Shipment/)).toBeInTheDocument();
    });

    test('should show warning for cancellation status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Update Order Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('New Status');
      fireEvent.change(statusSelect, { target: { value: 'cancelled' } });

      const updateButton = screen.getByText('Update Status');
      fireEvent.click(updateButton);

      // Should show cancellation warning
      expect(screen.getByText('Warning:')).toBeInTheDocument();
      expect(screen.getByText(/initiate a refund and restock items/)).toBeInTheDocument();
    });

    test('should show tracking information in confirmation for shipped status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Update Order Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('New Status');
      fireEvent.change(statusSelect, { target: { value: 'shipped' } });

      const trackingNumberInput = screen.getByLabelText('Tracking Number *');
      const trackingUrlInput = screen.getByLabelText('Tracking URL *');
      
      fireEvent.change(trackingNumberInput, { target: { value: 'TRK123456789' } });
      fireEvent.change(trackingUrlInput, { target: { value: 'https://tracking.example.com/TRK123456789' } });

      const updateButton = screen.getByText('Update Status');
      fireEvent.click(updateButton);

      // Should show tracking info in confirmation
      expect(screen.getByText('Tracking Information:')).toBeInTheDocument();
      expect(screen.getByText('Number: TRK123456789')).toBeInTheDocument();
      expect(screen.getByText('URL: https://tracking.example.com/TRK123456789')).toBeInTheDocument();
    });
  });

  describe('Status Update API Integration', () => {
    test('should call updateOrderStatus API when confirmed', async () => {
      adminService.updateOrderStatus.mockResolvedValue({
        success: true,
        data: { order: { ...mockOrder, status: 'awaiting_shipment' } }
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Update Order Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('New Status');
      fireEvent.change(statusSelect, { target: { value: 'awaiting_shipment' } });

      const updateButton = screen.getByText('Update Status');
      fireEvent.click(updateButton);

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(adminService.updateOrderStatus).toHaveBeenCalledWith('test-order-id', {
          newStatus: 'awaiting_shipment'
        });
      });
    });

    test('should include tracking info in API call for shipped status', async () => {
      adminService.updateOrderStatus.mockResolvedValue({
        success: true,
        data: { order: { ...mockOrder, status: 'shipped' } }
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Update Order Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('New Status');
      fireEvent.change(statusSelect, { target: { value: 'shipped' } });

      const trackingNumberInput = screen.getByLabelText('Tracking Number *');
      const trackingUrlInput = screen.getByLabelText('Tracking URL *');
      
      fireEvent.change(trackingNumberInput, { target: { value: 'TRK123456789' } });
      fireEvent.change(trackingUrlInput, { target: { value: 'https://tracking.example.com/TRK123456789' } });

      const updateButton = screen.getByText('Update Status');
      fireEvent.click(updateButton);

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(adminService.updateOrderStatus).toHaveBeenCalledWith('test-order-id', {
          newStatus: 'shipped',
          trackingNumber: 'TRK123456789',
          trackingUrl: 'https://tracking.example.com/TRK123456789'
        });
      });
    });

    test('should validate tracking fields for shipped status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Update Order Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('New Status');
      fireEvent.change(statusSelect, { target: { value: 'shipped' } });

      // Try to update without tracking info
      const updateButton = screen.getByText('Update Status');
      fireEvent.click(updateButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/tracking number and tracking URL are required/i)).toBeInTheDocument();
      });

      // Should not show confirmation dialog
      expect(screen.queryByText('Confirm Status Update')).not.toBeInTheDocument();
    });

    test('should handle API errors gracefully', async () => {
      adminService.updateOrderStatus.mockRejectedValue(new Error('API Error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Update Order Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('New Status');
      fireEvent.change(statusSelect, { target: { value: 'awaiting_shipment' } });

      const updateButton = screen.getByText('Update Status');
      fireEvent.click(updateButton);

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/API Error/)).toBeInTheDocument();
      });
    });

    test('should reload order details after successful update', async () => {
      const updatedOrder = { ...mockOrder, status: 'awaiting_shipment' };
      adminService.updateOrderStatus.mockResolvedValue({
        success: true,
        data: { order: updatedOrder }
      });

      // Mock second call to getOrderById for refresh
      adminService.getOrderById
        .mockResolvedValueOnce({ data: { order: mockOrder } })
        .mockResolvedValueOnce({ data: { order: updatedOrder } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Update Order Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('New Status');
      fireEvent.change(statusSelect, { target: { value: 'awaiting_shipment' } });

      const updateButton = screen.getByText('Update Status');
      fireEvent.click(updateButton);

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      // Should call getOrderById again to refresh
      await waitFor(() => {
        expect(adminService.getOrderById).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Dialog Interactions', () => {
    test('should close dialog and reset form when cancelled', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Update Order Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('New Status');
      fireEvent.change(statusSelect, { target: { value: 'awaiting_shipment' } });

      const updateButton = screen.getByText('Update Status');
      fireEvent.click(updateButton);

      expect(screen.getByText('Confirm Status Update')).toBeInTheDocument();

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Dialog should be closed
      expect(screen.queryByText('Confirm Status Update')).not.toBeInTheDocument();
      
      // Form should be reset
      expect(statusSelect.value).toBe('');
    });

    test('should disable buttons during loading', async () => {
      adminService.updateOrderStatus.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: { order: mockOrder } }), 100))
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Update Order Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('New Status');
      fireEvent.change(statusSelect, { target: { value: 'awaiting_shipment' } });

      const updateButton = screen.getByText('Update Status');
      fireEvent.click(updateButton);

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      // Buttons should be disabled during loading
      await waitFor(() => {
        expect(screen.getByText('Updating...')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });
  });
});