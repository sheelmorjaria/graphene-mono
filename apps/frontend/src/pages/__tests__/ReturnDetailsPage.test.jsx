import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ReturnDetailsPage from '../ReturnDetailsPage';
import * as returnService from '../../services/returnService';

// Mock the return service
vi.mock('../../services/returnService');

// Mock router with return request ID parameter
const MockRouterWithParams = ({ children, returnRequestId = 'return123' }) => (
  <MemoryRouter initialEntries={[`/my-account/returns/${returnRequestId}`]}>
    {children}
  </MemoryRouter>
);

describe('ReturnDetailsPage', () => {
  const mockReturnRequest = {
    id: 'return123',
    returnRequestNumber: '20241201001',
    formattedRequestNumber: 'RET-20241201001',
    orderNumber: 'ORD-123456',
    orderId: 'order123',
    status: 'approved',
    formattedStatus: 'Approved',
    totalRefundAmount: 599,
    totalItemsCount: 2,
    requestDate: '2024-12-01T10:00:00Z',
    approvedDate: '2024-12-02T14:30:00Z',
    itemReceivedDate: null,
    refundProcessedDate: null,
    items: [
      {
        productId: 'product1',
        productName: 'Google Pixel 8 Pro (256GB)',
        productSlug: 'google-pixel-8-pro-256gb',
        quantity: 1,
        unitPrice: 899,
        totalRefundAmount: 899,
        reason: 'damaged_received',
        reasonDescription: 'Screen was cracked upon arrival'
      },
      {
        productId: 'product2',
        productName: 'Privacy Screen Protector',
        productSlug: 'privacy-screen-protector',
        quantity: 2,
        unitPrice: 29.99,
        totalRefundAmount: 59.98,
        reason: 'wrong_item_sent',
        reasonDescription: 'Received different model'
      }
    ],
    images: [
      {
        url: 'https://example.com/image1.jpg',
        description: 'Damaged screen photo',
        uploadedAt: '2024-12-01T10:05:00Z'
      }
    ],
    returnShippingAddress: {
      companyName: 'GrapheneOS Store Returns',
      addressLine1: '123 Return Processing Center',
      addressLine2: 'Unit 5',
      city: 'London',
      stateProvince: 'England',
      postalCode: 'SW1A 1AA',
      country: 'GB'
    },
    adminNotes: 'Approved for full refund. Customer provided clear evidence of damage.',
    refundId: 'ref_123456789',
    refundStatus: 'succeeded',
    returnWindow: 30,
    isWithinReturnWindow: true,
    order: {
      _id: 'order123',
      orderNumber: 'ORD-123456',
      orderDate: '2024-11-15T09:00:00Z',
      deliveryDate: '2024-11-20T16:30:00Z'
    },
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-02T14:30:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    returnService.getReturnRequestDetails.mockResolvedValue({
      data: { returnRequest: mockReturnRequest }
    });
  });

  it('renders return details page correctly', async () => {
    render(
      <MockRouterWithParams>
        <ReturnDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('Return Request RET-20241201001')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
    });
  });

  it('displays return request summary information', async () => {
    render(
      <MockRouterWithParams>
        <ReturnDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('RET-20241201001')).toBeInTheDocument();
      expect(screen.getByText('ORD-123456')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // items count
      expect(screen.getByText('£599.00')).toBeInTheDocument(); // refund amount
    });
  });

  it('displays status timeline correctly', async () => {
    render(
      <MockRouterWithParams>
        <ReturnDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('Return Status Timeline')).toBeInTheDocument();
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Item Received')).toBeInTheDocument();
      expect(screen.getByText('Processing Refund')).toBeInTheDocument();
      expect(screen.getByText('Refunded')).toBeInTheDocument();
    });
  });

  it('displays returned items with correct information', async () => {
    render(
      <MockRouterWithParams>
        <ReturnDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('Returned Items')).toBeInTheDocument();
      expect(screen.getByText('Google Pixel 8 Pro (256GB)')).toBeInTheDocument();
      expect(screen.getByText('Privacy Screen Protector')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 1')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
      expect(screen.getByText('£899.00')).toBeInTheDocument();
      expect(screen.getByText('£59.98')).toBeInTheDocument();
    });
  });

  it('displays return reasons correctly', async () => {
    render(
      <MockRouterWithParams>
        <ReturnDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('Damaged on Arrival')).toBeInTheDocument();
      expect(screen.getByText('Wrong Item Sent')).toBeInTheDocument();
      expect(screen.getByText('Screen was cracked upon arrival')).toBeInTheDocument();
      expect(screen.getByText('Received different model')).toBeInTheDocument();
    });
  });

  it('displays supporting images when available', async () => {
    render(
      <MockRouterWithParams>
        <ReturnDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('Supporting Images')).toBeInTheDocument();
      const image = screen.getByAltText('Damaged screen photo');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg');
    });
  });

  it('displays admin notes when available', async () => {
    render(
      <MockRouterWithParams>
        <ReturnDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('Notes from Support')).toBeInTheDocument();
      expect(screen.getByText('Approved for full refund. Customer provided clear evidence of damage.')).toBeInTheDocument();
    });
  });

  it('displays return shipping address', async () => {
    render(
      <MockRouterWithParams>
        <ReturnDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('Return Shipping Address')).toBeInTheDocument();
      expect(screen.getByText('GrapheneOS Store Returns')).toBeInTheDocument();
      expect(screen.getByText('123 Return Processing Center')).toBeInTheDocument();
      expect(screen.getByText('London, England SW1A 1AA')).toBeInTheDocument();
    });
  });

  it('displays refund information when available', async () => {
    render(
      <MockRouterWithParams>
        <ReturnDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('Refund Information')).toBeInTheDocument();
      expect(screen.getByText('ref_123456789')).toBeInTheDocument();
      expect(screen.getByText('Succeeded')).toBeInTheDocument();
    });
  });

  it('handles rejected status timeline correctly', async () => {
    const rejectedReturnRequest = {
      ...mockReturnRequest,
      status: 'rejected',
      approvedDate: null,
      updatedAt: '2024-12-02T14:30:00Z'
    };

    returnService.getReturnRequestDetails.mockResolvedValue({
      data: { returnRequest: rejectedReturnRequest }
    });

    render(
      <MockRouterWithParams>
        <ReturnDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
      // Should not show other timeline steps
      expect(screen.queryByText('Item Received')).not.toBeInTheDocument();
    });
  });

  it('renders navigation links correctly', async () => {
    render(
      <MockRouterWithParams>
        <ReturnDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      const viewOrderLink = screen.getByText('View Original Order');
      const backToReturnsLink = screen.getByText('Back to Returns');
      
      expect(viewOrderLink.closest('a')).toHaveAttribute('href', '/orders/order123');
      expect(backToReturnsLink.closest('a')).toHaveAttribute('href', '/my-account/returns');
    });
  });

  it('handles API error gracefully', async () => {
    const errorMessage = 'Failed to load return request details';
    returnService.getReturnRequestDetails.mockRejectedValue(new Error(errorMessage));

    render(
      <MockRouterWithParams>
        <ReturnDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('Error Loading Return Request')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles return request not found', async () => {
    returnService.getReturnRequestDetails.mockResolvedValue({
      data: { returnRequest: null }
    });

    render(
      <MockRouterWithParams>
        <ReturnDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('Return Request Not Found')).toBeInTheDocument();
      expect(screen.getByText("The return request you're looking for doesn't exist or you don't have permission to view it.")).toBeInTheDocument();
    });
  });

  it('displays breadcrumb navigation correctly', async () => {
    render(
      <MockRouterWithParams>
        <ReturnDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.getByText('My Account')).toBeInTheDocument();
      expect(screen.getByText('My Returns')).toBeInTheDocument();
      expect(screen.getByText('RET-20241201001')).toBeInTheDocument();
    });
  });

  it('does not display sections when data is not available', async () => {
    const minimalReturnRequest = {
      ...mockReturnRequest,
      images: [],
      adminNotes: null,
      refundId: null,
      refundStatus: null
    };

    returnService.getReturnRequestDetails.mockResolvedValue({
      data: { returnRequest: minimalReturnRequest }
    });

    render(
      <MockRouterWithParams>
        <ReturnDetailsPage />
      </MockRouterWithParams>
    );

    await waitFor(() => {
      expect(screen.queryByText('Supporting Images')).not.toBeInTheDocument();
      expect(screen.queryByText('Notes from Support')).not.toBeInTheDocument();
      expect(screen.queryByText('Refund Information')).not.toBeInTheDocument();
    });
  });
});