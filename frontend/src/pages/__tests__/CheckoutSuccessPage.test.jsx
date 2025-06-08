import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import CheckoutSuccessPage from '../CheckoutSuccessPage';

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('token=PAYPAL123&PayerID=PAYER123')]
  };
});

// Mock payment service
vi.mock('../../services/paymentService', () => ({
  capturePayPalPayment: vi.fn()
}));

// Mock cart service
vi.mock('../../services/cartService', () => ({
  formatCurrency: vi.fn((amount) => `£${amount.toFixed(2)}`)
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CheckoutSuccessPage', () => {
  let capturePayPalPayment;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
    
    // Get the mocked functions
    const paymentService = await vi.importMock('../../services/paymentService');
    capturePayPalPayment = paymentService.capturePayPalPayment;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows processing state initially', () => {
    capturePayPalPayment.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithRouter(<CheckoutSuccessPage />);

    expect(screen.getByText('Processing Payment')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we confirm your payment. This may take a few moments.')).toBeInTheDocument();
    expect(screen.getByText('Please do not close this window or navigate away from this page.')).toBeInTheDocument();
  });

  it('processes PayPal payment successfully', async () => {
    const mockSuccessResponse = {
      success: true,
      data: {
        orderId: 'ORDER_123',
        orderNumber: 'ORD123456',
        amount: 299.99,
        paymentMethod: 'paypal'
      }
    };

    capturePayPalPayment.mockResolvedValue(mockSuccessResponse);

    renderWithRouter(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    });

    expect(screen.getByText('Your payment has been processed successfully. You will be redirected to your order details shortly.')).toBeInTheDocument();
    expect(screen.getByText('Order Number:')).toBeInTheDocument();
    expect(screen.getByText('#ORD123456')).toBeInTheDocument();
    expect(screen.getByText('Amount Paid:')).toBeInTheDocument();
    expect(screen.getByText('£299.99')).toBeInTheDocument();
    expect(screen.getByText('Payment Method:')).toBeInTheDocument();
    expect(screen.getByText('Paypal')).toBeInTheDocument();
  });

  it('redirects to order details after successful payment', async () => {
    const mockSuccessResponse = {
      success: true,
      data: {
        orderId: 'ORDER_123',
        orderNumber: 'ORD123456',
        amount: 299.99,
        paymentMethod: 'paypal'
      }
    };

    capturePayPalPayment.mockResolvedValue(mockSuccessResponse);

    renderWithRouter(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    });

    // Fast-forward the timer for auto-redirect
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/orders/ORDER_123');
    });
  });

  it('handles PayPal payment failure', async () => {
    const mockErrorResponse = {
      success: false,
      error: 'Payment capture failed'
    };

    capturePayPalPayment.mockResolvedValue(mockErrorResponse);

    renderWithRouter(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).toBeInTheDocument();
    });

    expect(screen.getByText('Payment capture failed')).toBeInTheDocument();
    expect(screen.getByText('Your payment was not processed. No charges have been made to your account.')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Return to Cart')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });

  it('handles network errors during payment processing', async () => {
    capturePayPalPayment.mockRejectedValue(new Error('Network error'));

    renderWithRouter(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).toBeInTheDocument();
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('handles missing PayPal parameters', async () => {
    // Mock useSearchParams to return empty params
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [new URLSearchParams('')]
      };
    });

    const { CheckoutSuccessPage: TestComponent } = await import('../CheckoutSuccessPage');

    renderWithRouter(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).toBeInTheDocument();
    });

    expect(screen.getByText('Invalid payment parameters. Please try again.')).toBeInTheDocument();
  });

  it('calls capturePayPalPayment with correct parameters', async () => {
    const mockSuccessResponse = {
      success: true,
      data: { orderId: 'ORDER_123' }
    };

    capturePayPalPayment.mockResolvedValue(mockSuccessResponse);

    renderWithRouter(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(capturePayPalPayment).toHaveBeenCalledWith({
        paypalOrderId: 'PAYPAL123',
        payerId: 'PAYER123'
      });
    });
  });

  it('updates document title based on payment status', async () => {
    const mockSuccessResponse = {
      success: true,
      data: { orderId: 'ORDER_123' }
    };

    capturePayPalPayment.mockResolvedValue(mockSuccessResponse);

    renderWithRouter(<CheckoutSuccessPage />);

    // Initial title
    expect(document.title).toBe('Payment Processing - GrapheneOS Store');

    await waitFor(() => {
      expect(document.title).toBe('Payment Successful - GrapheneOS Store');
    });
  });

  it('provides navigation options on success', async () => {
    const mockSuccessResponse = {
      success: true,
      data: { orderId: 'ORDER_123' }
    };

    capturePayPalPayment.mockResolvedValue(mockSuccessResponse);

    renderWithRouter(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByText('View My Orders')).toBeInTheDocument();
      expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
    });

    const viewOrdersLink = screen.getByText('View My Orders');
    const continueShoppingLink = screen.getByText('Continue Shopping');

    expect(viewOrdersLink.closest('a')).toHaveAttribute('href', '/orders');
    expect(continueShoppingLink.closest('a')).toHaveAttribute('href', '/products');
  });

  it('provides error recovery options on failure', async () => {
    capturePayPalPayment.mockRejectedValue(new Error('Payment failed'));

    renderWithRouter(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Return to Cart')).toBeInTheDocument();
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
    });

    const returnToCartLink = screen.getByText('Return to Cart');
    const contactSupportLink = screen.getByText('Contact Support');

    expect(returnToCartLink.closest('a')).toHaveAttribute('href', '/cart');
    expect(contactSupportLink.closest('a')).toHaveAttribute('href', '/support');
  });

  it('shows auto-redirect message on success', async () => {
    const mockSuccessResponse = {
      success: true,
      data: { orderId: 'ORDER_123' }
    };

    capturePayPalPayment.mockResolvedValue(mockSuccessResponse);

    renderWithRouter(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByText('Redirecting to your order details in a few seconds...')).toBeInTheDocument();
    });
  });
});