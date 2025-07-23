import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import CheckoutSuccessPage from '../CheckoutSuccessPage';

// Mock functions
const mockNavigate = vi.fn();
const mockCapturePayPalPayment = vi.fn();
const mockFormatCurrency = vi.fn((amount) => `£${amount.toFixed(2)}`);

// Create a mutable ref for search params
const searchParamsRef = { current: new URLSearchParams('token=PAYPAL123&PayerID=PAYER123') };

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [searchParamsRef.current]
  };
});

// Mock payment service
vi.mock('../../services/paymentService', () => ({
  capturePayPalPayment: (...args) => mockCapturePayPalPayment(...args),
  formatCurrency: (...args) => mockFormatCurrency(...args)
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CheckoutSuccessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
    
    // Reset to default search params
    searchParamsRef.current = new URLSearchParams('token=PAYPAL123&PayerID=PAYER123');
    
    // Reset document title
    document.title = '';
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows processing state initially', async () => {
    mockCapturePayPalPayment.mockImplementation(() => new Promise(() => {})); // Never resolves

    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

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

    mockCapturePayPalPayment.mockResolvedValue(mockSuccessResponse);

    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    // Use real timers for this test to let promises resolve
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(screen.getByText('Your payment has been processed successfully. You will be redirected to your order details shortly.')).toBeInTheDocument();
    expect(screen.getByText('Order Number:')).toBeInTheDocument();
    expect(screen.getByText('#ORD123456')).toBeInTheDocument();
    expect(screen.getByText('Amount Paid:')).toBeInTheDocument();
    expect(screen.getByText('£299.99')).toBeInTheDocument();
    expect(screen.getByText('Payment Method:')).toBeInTheDocument();
    expect(screen.getByText('paypal')).toBeInTheDocument();

    // Restore fake timers
    vi.useFakeTimers();
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

    mockCapturePayPalPayment.mockResolvedValue(mockSuccessResponse);

    // Use real timers for this entire test
    vi.useRealTimers();

    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Wait for the setTimeout to trigger the navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/orders/ORDER_123');
    }, { timeout: 4000 });

    // Restore fake timers
    vi.useFakeTimers();
  });

  it('handles PayPal payment failure', async () => {
    const mockErrorResponse = {
      success: false,
      error: 'Payment capture failed'
    };

    mockCapturePayPalPayment.mockResolvedValue(mockErrorResponse);

    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    // Use real timers
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(screen.getByText('Payment capture failed')).toBeInTheDocument();
    expect(screen.getByText('Your payment was not processed. No charges have been made to your account.')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Return to Cart')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();

    // Restore fake timers
    vi.useFakeTimers();
  });

  it('handles network errors during payment processing', async () => {
    mockCapturePayPalPayment.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    // Use real timers
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(screen.getByText('Network error')).toBeInTheDocument();

    // Restore fake timers
    vi.useFakeTimers();
  });

  it('handles missing PayPal parameters', async () => {
    // Set empty search params for this test
    searchParamsRef.current = new URLSearchParams('');

    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    // Use real timers
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(screen.getByText('Invalid payment parameters. Please try again.')).toBeInTheDocument();

    // Restore fake timers
    vi.useFakeTimers();
  });

  it('calls capturePayPalPayment with correct parameters', async () => {
    const mockSuccessResponse = {
      success: true,
      data: { orderId: 'ORDER_123' }
    };

    mockCapturePayPalPayment.mockResolvedValue(mockSuccessResponse);

    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    // Use real timers
    vi.useRealTimers();

    await waitFor(() => {
      expect(mockCapturePayPalPayment).toHaveBeenCalledWith({
        paypalOrderId: 'PAYPAL123',
        payerId: 'PAYER123'
      });
    }, { timeout: 5000 });

    // Restore fake timers
    vi.useFakeTimers();
  });

  it('updates document title based on payment status', async () => {
    const mockSuccessResponse = {
      success: true,
      data: { orderId: 'ORDER_123' }
    };

    // Make the promise resolve after a small delay to observe the processing state
    mockCapturePayPalPayment.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockSuccessResponse), 100))
    );

    // Use real timers for this test
    vi.useRealTimers();

    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    // Wait a tick for useEffect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // The component sets the title synchronously in useEffect
    expect(document.title).toBe('Payment Processing - GrapheneOS Store');

    await waitFor(() => {
      expect(document.title).toBe('Payment Successful - GrapheneOS Store');
    }, { timeout: 5000 });

    // Restore fake timers
    vi.useFakeTimers();
  });

  it('provides navigation options on success', async () => {
    const mockSuccessResponse = {
      success: true,
      data: { orderId: 'ORDER_123' }
    };

    mockCapturePayPalPayment.mockResolvedValue(mockSuccessResponse);

    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    // Use real timers
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('View My Orders')).toBeInTheDocument();
      expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
    }, { timeout: 5000 });

    const viewOrdersLink = screen.getByText('View My Orders');
    const continueShoppingLink = screen.getByText('Continue Shopping');

    expect(viewOrdersLink.closest('a')).toHaveAttribute('href', '/orders');
    expect(continueShoppingLink.closest('a')).toHaveAttribute('href', '/products');

    // Restore fake timers
    vi.useFakeTimers();
  });

  it('provides error recovery options on failure', async () => {
    mockCapturePayPalPayment.mockRejectedValue(new Error('Payment failed'));

    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    // Use real timers
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Return to Cart')).toBeInTheDocument();
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
    }, { timeout: 5000 });

    const returnToCartLink = screen.getByText('Return to Cart');
    const contactSupportLink = screen.getByText('Contact Support');

    expect(returnToCartLink.closest('a')).toHaveAttribute('href', '/cart');
    expect(contactSupportLink.closest('a')).toHaveAttribute('href', '/support');

    // Restore fake timers
    vi.useFakeTimers();
  });

  it('shows auto-redirect message on success', async () => {
    const mockSuccessResponse = {
      success: true,
      data: { orderId: 'ORDER_123' }
    };

    mockCapturePayPalPayment.mockResolvedValue(mockSuccessResponse);

    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    // Use real timers
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('Redirecting to your order details in a few seconds...')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Restore fake timers
    vi.useFakeTimers();
  });
});