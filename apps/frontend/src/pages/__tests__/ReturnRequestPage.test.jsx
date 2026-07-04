import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ReturnRequestPage from '../ReturnRequestPage';
import * as orderService from '../../services/orderService';
import * as returnService from '../../services/returnService';

// Mock services
vi.mock('../../services/orderService', () => ({
  getUserOrderDetails: vi.fn()
}));
vi.mock('../../services/returnService', () => ({
  submitReturnRequest: vi.fn()
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// A delivered order within the return window
const buildDeliveredOrder = (overrides = {}) => ({
  orderNumber: 'ORD-123',
  status: 'delivered',
  deliveryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  orderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  hasReturnRequest: false,
  items: [
    {
      productId: 'p1',
      productName: 'Pixel 8',
      productSlug: 'pixel-8',
      quantity: 2,
      unitPrice: 500
    }
  ],
  ...overrides
});

const renderPage = (orderId = 'order-1') => {
  return render(
    <MemoryRouter initialEntries={[`/returns/${orderId}`]}>
      <Routes>
        <Route path="/returns/:orderId" element={<ReturnRequestPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ReturnRequestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = '';
  });

  it('shows loading spinner then renders the form for an eligible order', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: buildDeliveredOrder() }
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Request Return' })).toBeInTheDocument();
    });
    expect(screen.getByText('ORD-123')).toBeInTheDocument();
    expect(screen.getByText('Pixel 8')).toBeInTheDocument();
  });

  it('sets the document title using the order number', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: buildDeliveredOrder() }
    });

    renderPage();

    await waitFor(() => {
      expect(document.title).toBe('Request Return - Order ORD-123 - Graphene Security');
    });
  });

  it('shows an error when order is not delivered', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: buildDeliveredOrder({ status: 'shipped' }) }
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Only delivered orders are eligible for returns.')).toBeInTheDocument();
    });
  });

  it('shows an error when delivery date is missing', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: buildDeliveredOrder({ deliveryDate: null }) }
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Unable to determine delivery date for this order.')).toBeInTheDocument();
    });
  });

  it('shows an error when the 30-day return window has expired', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: {
        order: buildDeliveredOrder({
          deliveryDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
        })
      }
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('The 30-day return window has expired for this order.')).toBeInTheDocument();
    });
  });

  it('shows an error when a return request already exists', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: buildDeliveredOrder({ hasReturnRequest: true }) }
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('A return request has already been submitted for this order.')).toBeInTheDocument();
    });
  });

  it('shows an error when loading the order fails', async () => {
    orderService.getUserOrderDetails.mockRejectedValue(new Error('Network error'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('reveals quantity/reason fields when an item is selected', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: buildDeliveredOrder() }
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Pixel 8')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(screen.getByText(/Return Quantity/i)).toBeInTheDocument();
    expect(screen.getByText(/Reason for Return/i)).toBeInTheDocument();
  });

  it('disables the submit button when no items are selected', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: buildDeliveredOrder() }
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Pixel 8')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /Submit Return Request/i });
    expect(submitButton).toBeDisabled();
    expect(returnService.submitReturnRequest).not.toHaveBeenCalled();
  });

  it('blocks submission via native validation when a reason is missing', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: buildDeliveredOrder() }
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Pixel 8')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox'));

    const submitButton = screen.getByRole('button', { name: /Submit Return Request/i });
    expect(submitButton).not.toBeDisabled();

    // The reason <select> is required; jsdom enforces native validation so the
    // submit handler is never reached and no submission error is rendered.
    fireEvent.click(submitButton);

    expect(returnService.submitReturnRequest).not.toHaveBeenCalled();
    expect(
      screen.queryByText('Please provide a reason for each selected item.')
    ).not.toBeInTheDocument();
  });

  it('submits the return request with valid data and navigates', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: buildDeliveredOrder() }
    });
    returnService.submitReturnRequest.mockResolvedValue({ success: true });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Pixel 8')).toBeInTheDocument();
    });

    // Select the item
    fireEvent.click(screen.getByRole('checkbox'));

    // Choose a reason
    const reasonSelect = screen.getByDisplayValue('Select a reason...');
    fireEvent.change(reasonSelect, { target: { value: 'damaged_received' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit Return Request/i }));

    await waitFor(() => {
      expect(returnService.submitReturnRequest).toHaveBeenCalledTimes(1);
    });

    const callArg = returnService.submitReturnRequest.mock.calls[0][0];
    expect(callArg.orderId).toBe('order-1');
    expect(callArg.items[0]).toMatchObject({
      productId: 'p1',
      productName: 'Pixel 8',
      quantity: 1,
      reason: 'damaged_received'
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      '/my-account/orders/order-1',
      { state: { message: 'Return request submitted successfully!' } }
    );
  });

  it('shows a server error when submission fails', async () => {
    orderService.getUserOrderDetails.mockResolvedValue({
      data: { order: buildDeliveredOrder() }
    });
    returnService.submitReturnRequest.mockRejectedValue(new Error('Server down'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Pixel 8')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByDisplayValue('Select a reason...'), {
      target: { value: 'defective_item' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Submit Return Request/i }));

    await waitFor(() => {
      expect(screen.getByText('Server down')).toBeInTheDocument();
    });
  });
});
