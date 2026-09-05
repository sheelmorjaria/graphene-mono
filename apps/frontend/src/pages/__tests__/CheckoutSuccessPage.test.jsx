import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import CheckoutSuccessPage from '../CheckoutSuccessPage';

// Mock functions
const mockNavigate = vi.fn();
const mockCapturePayPalPayment = vi.fn();
const mockFormatCurrency = vi.fn((amount) => `£${amount.toFixed(2)}`);

// Mutable refs the mocked hooks read from
const searchParamsRef = { current: new URLSearchParams('token=PAYPAL123&PayerID=PAYER123') };
const locationStateRef = { current: null };
const authRef = { current: { isAuthenticated: true, isLoading: false } };

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [searchParamsRef.current],
    useLocation: () => ({ state: locationStateRef.current })
  };
});

// Mock auth context (the page renders guest vs account variants from it)
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => authRef.current
}));

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

const successResponse = () => ({
  success: true,
  data: {
    orderId: 'ORDER_123',
    orderNumber: 'ORD123456',
    amount: 299.99,
    paymentMethod: 'paypal',
    customerEmail: 'guest@example.com'
  }
});

describe('CheckoutSuccessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    searchParamsRef.current = new URLSearchParams('token=PAYPAL123&PayerID=PAYER123');
    locationStateRef.current = null;
    authRef.current = { isAuthenticated: true, isLoading: false };
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
  });

  it('renders immediately from navigation state without re-capturing', async () => {
    locationStateRef.current = { capturedOrder: successResponse().data };

    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    expect(screen.getByText('#ORD123456')).toBeInTheDocument();
    expect(mockCapturePayPalPayment).not.toHaveBeenCalled();
  });

  it('captures via the URL fallback when no state is present', async () => {
    mockCapturePayPalPayment.mockResolvedValue(successResponse());

    vi.useRealTimers();
    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    await waitFor(() => {
      expect(mockCapturePayPalPayment).toHaveBeenCalledWith({
        paypalOrderId: 'PAYPAL123',
        payerId: 'PAYER123'
      });
    }, { timeout: 5000 });

    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('shows order summary with receipt email for a successful payment', async () => {
    mockCapturePayPalPayment.mockResolvedValue(successResponse());

    vi.useRealTimers();
    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(screen.getByText('Order Number:')).toBeInTheDocument();
    expect(screen.getByText('#ORD123456')).toBeInTheDocument();
    expect(screen.getByText('£299.99')).toBeInTheDocument();
    expect(screen.getByText('Confirmation sent to:')).toBeInTheDocument();
    expect(screen.getByText('guest@example.com')).toBeInTheDocument();
  });

  it('links logged-in users to their order details without auto-redirect', async () => {
    mockCapturePayPalPayment.mockResolvedValue(successResponse());

    vi.useRealTimers();
    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('View Order Details')).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(screen.getByText('View Order Details').closest('a')).toHaveAttribute('href', '/orders/ORDER_123');
    expect(screen.getByText('Continue Shopping').closest('a')).toHaveAttribute('href', '/products');

    // No forced 3s redirect anymore
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 3500));
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('hides order links for guests and shows the email-receipt note', async () => {
    authRef.current = { isAuthenticated: false, isLoading: false };
    locationStateRef.current = { capturedOrder: successResponse().data };

    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    expect(screen.getByText(/as a guest/)).toBeInTheDocument();
    expect(screen.getByText(/confirmation email with your order details/)).toBeInTheDocument();
    expect(screen.queryByText('View Order Details')).not.toBeInTheDocument();
    expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
  });

  it('handles PayPal payment failure', async () => {
    mockCapturePayPalPayment.mockResolvedValue({
      success: false,
      error: 'Payment capture failed'
    });

    vi.useRealTimers();
    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Payment Failed')).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(screen.getByText('Payment capture failed')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Return to Cart')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });

  it('handles network errors during payment processing', async () => {
    mockCapturePayPalPayment.mockRejectedValue(new Error('Network error'));

    vi.useRealTimers();
    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('handles missing PayPal parameters', async () => {
    searchParamsRef.current = new URLSearchParams('');

    vi.useRealTimers();
    await act(async () => {
      renderWithRouter(<CheckoutSuccessPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid payment parameters. Please try again.')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
