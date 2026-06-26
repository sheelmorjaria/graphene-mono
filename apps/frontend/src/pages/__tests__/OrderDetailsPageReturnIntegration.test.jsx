import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import OrderDetailsPage from '../OrderDetailsPage';
import * as orderService from '../../services/orderService';
import * as returnService from '../../services/returnService';

// Mock the services
vi.mock('../../services/orderService');
vi.mock('../../services/returnService');

// Mock router with order ID parameter.
// A <Route> must be registered so useParams() resolves :orderId; without it
// the page's orderId param is undefined and the return-request lookup fails.
const MockRouterWithParams = ({ children, orderId = 'order123' }) => (
  <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
    <Routes>
      <Route path="/orders/:orderId" element={children} />
    </Routes>
  </MemoryRouter>
);

describe('OrderDetailsPage - Return Status Integration', () => {
  const mockOrderWithoutReturn = {
    _id: 'order123',
    orderNumber: 'ORD-123456',
    orderDate: '2024-11-15T09:00:00Z',
    formattedDate: '15 November 2024',
    status: 'delivered',
    statusDisplay: 'Delivered',
    deliveryDate: '2024-11-20T16:30:00Z',
    hasReturnRequest: false,
    items: [
      {
        _id: 'item1',
        productId: 'product1',
        productName: 'Google Pixel 8 Pro',
        productSlug: 'google-pixel-8-pro',
        quantity: 1,
        unitPrice: 899,
        totalPrice: 899,
        productImage: 'https://example.com/image.jpg'
      }
    ],
    subtotal: 899,
    shipping: 0,
    tax: 179.80,
    totalAmount: 1078.80,
    shippingAddress: {
      fullName: 'John Doe',
      addressLine1: '123 Test Street',
      city: 'London',
      stateProvince: 'England',
      postalCode: 'SW1A 1AA',
      country: 'GB'
    },
    billingAddress: {
      fullName: 'John Doe',
      addressLine1: '123 Test Street',
      city: 'London',
      stateProvince: 'England',
      postalCode: 'SW1A 1AA',
      country: 'GB'
    },
    paymentMethodDisplay: 'PayPal',
    paymentStatus: 'paid',
    statusHistory: []
  };

  const mockOrderWithReturn = {
    ...mockOrderWithoutReturn,
    hasReturnRequest: true
  };

  const mockReturnRequest = {
    id: 'return123',
    returnRequestNumber: '20241201001',
    formattedRequestNumber: 'RET-20241201001',
    orderId: 'order123',
    status: 'approved',
    totalRefundAmount: 899,
    totalItemsCount: 1,
    requestDate: '2024-12-01T10:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock currency formatting
    orderService.formatCurrency.mockImplementation((amount) => `£${amount.toFixed(2)}`);
    orderService.getStatusColor.mockReturnValue('text-green-600');
    orderService.cancelOrder.mockResolvedValue({ success: true });
    
    // Mock return service functions
    returnService.formatReturnStatus.mockImplementation((status) => {
      const statusMap = {
        'approved': 'Approved',
        'pending_review': 'Pending Review',
        'refunded': 'Refunded'
      };
      return statusMap[status] || status;
    });
    
    returnService.getReturnStatusColorClass.mockImplementation(() => {
      return 'text-green-600 bg-green-50';
    });
  });

  it('does not show return status section when order has no return request', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: mockOrderWithoutReturn }
    });

    render(
      <MockRouterWithParams>
        <OrderDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      // The order number renders inside "Order ORD-123456" (breadcrumb + heading)
      expect(screen.getAllByText('Order ORD-123456').length).toBeGreaterThanOrEqual(1);
    });

    // Should not show return status section
    expect(screen.queryByText('Return Request Status')).not.toBeInTheDocument();
  });

  it('shows return status section when order has return request', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: mockOrderWithReturn }
    });

    returnService.getUserReturnRequests.mockResolvedValue({
      data: [mockReturnRequest]
    });

    render(
      <MockRouterWithParams>
        <OrderDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('Return Request Status')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Return Request: RET-20241201001')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      // "1 item(s)" is split across a <span> and a text node within the same div
      expect(screen.getByText((content) => content.includes('item(s)'))).toBeInTheDocument();
      // £899.00 appears in both the order items and the return refund amount
      expect(screen.getAllByText('£899.00').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows loading state while fetching return request details', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: mockOrderWithReturn }
    });

    // Delay the return request response
    returnService.getUserReturnRequests.mockImplementation(() => 
      new Promise(resolve => {
        setTimeout(() => resolve({ data: [mockReturnRequest] }), 100);
      })
    );

    render(
      <MockRouterWithParams>
        <OrderDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('Return Request Status')).toBeInTheDocument();
    });

    expect(screen.getByText('Loading return request details...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Return Request: RET-20241201001')).toBeInTheDocument();
    });
  });

  it('shows fallback message when return request details cannot be loaded', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: mockOrderWithReturn }
    });

    returnService.getUserReturnRequests.mockRejectedValue(new Error('API Error'));

    render(
      <MockRouterWithParams>
        <OrderDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('Return Request Status')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('📦 A return request has been submitted for this order. You will receive updates via email.')).toBeInTheDocument();
    });
  });

  it('shows fallback message when no return request found', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: mockOrderWithReturn }
    });

    returnService.getUserReturnRequests.mockResolvedValue({
      data: [] // No return requests found
    });

    render(
      <MockRouterWithParams>
        <OrderDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('Return Request Status')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('📦 A return request has been submitted for this order. You will receive updates via email.')).toBeInTheDocument();
    });
  });

  it('includes View Return Details link with correct href', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: mockOrderWithReturn }
    });

    returnService.getUserReturnRequests.mockResolvedValue({
      data: [mockReturnRequest]
    });

    render(
      <MockRouterWithParams>
        <OrderDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      const viewDetailsLink = screen.getByText('View Return Details');
      expect(viewDetailsLink.closest('a')).toHaveAttribute('href', '/my-account/returns/return123');
    });
  });

  it('displays formatted submission date correctly', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: mockOrderWithReturn }
    });

    returnService.getUserReturnRequests.mockResolvedValue({
      data: [mockReturnRequest]
    });

    render(
      <MockRouterWithParams>
        <OrderDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('Submitted on 1 December 2024')).toBeInTheDocument();
    });
  });

  it('calls return service with correct parameters', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: mockOrderWithReturn }
    });

    returnService.getUserReturnRequests.mockResolvedValue({
      data: [mockReturnRequest]
    });

    render(
      <MockRouterWithParams>
        <OrderDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(returnService.getUserReturnRequests).toHaveBeenCalledWith();
    });
  });

  it('finds the correct return request for the order', async () => {
    const anotherReturnRequest = {
      id: 'return456',
      orderId: 'order456',
      formattedRequestNumber: 'RET-20241202001',
      status: 'pending_review'
    };

    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: mockOrderWithReturn }
    });

    returnService.getUserReturnRequests.mockResolvedValue({
      data: [anotherReturnRequest, mockReturnRequest] // Multiple returns, different orders
    });

    render(
      <MockRouterWithParams>
        <OrderDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      // Should show the return request for this specific order
      expect(screen.getByText('Return Request: RET-20241201001')).toBeInTheDocument();
      expect(screen.queryByText('Return Request: RET-20241202001')).not.toBeInTheDocument();
    });
  });
});