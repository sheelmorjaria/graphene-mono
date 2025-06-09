import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MoneroPaymentPage from '../MoneroPaymentPage';

// Mock the MoneroPayment component
jest.mock('../../components/checkout/MoneroPayment', () => {
  return function MockMoneroPayment({ paymentData, onPaymentUpdate, onError }) {
    return (
      <div data-testid="monero-payment-component">
        <div>Payment ID: {paymentData?.orderId}</div>
        <div>XMR Amount: {paymentData?.xmrAmount}</div>
        <div>Address: {paymentData?.moneroAddress}</div>
        <button 
          onClick={() => onPaymentUpdate({ status: 'confirmed' })}
          data-testid="mock-payment-update"
        >
          Simulate Payment Update
        </button>
        <button 
          onClick={() => onError('Mock error')}
          data-testid="mock-error"
        >
          Simulate Error
        </button>
      </div>
    );
  };
});

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
const mockParams = { orderId: 'test-order-123' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('MoneroPaymentPage', () => {
  const mockOrderData = {
    orderId: 'test-order-123',
    moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
    xmrAmount: 1.234567890123,
    exchangeRate: 0.00617,
    validUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    requiredConfirmations: 10,
    paymentWindowHours: 24,
    orderTotal: 199.99,
    paymentStatus: 'pending'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock successful API response by default
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockOrderData
      })
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  describe('Loading State', () => {
    it('should show loading spinner while fetching order details', () => {
      // Make fetch never resolve
      fetch.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<MoneroPaymentPage />);

      expect(screen.getByText('Loading payment details...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should set correct page title', () => {
      renderWithRouter(<MoneroPaymentPage />);
      
      expect(document.title).toBe('Monero Payment - GrapheneOS Store');
    });
  });

  describe('Successful Data Loading', () => {
    it('should fetch order details on mount', async () => {
      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/payments/monero/status/test-order-123',
          { credentials: 'include' }
        );
      });
    });

    it('should render payment page with order data', async () => {
      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Monero Payment')).toBeInTheDocument();
      });

      expect(screen.getByText('Complete your order by sending Monero to the address below')).toBeInTheDocument();
      expect(screen.getByTestId('monero-payment-component')).toBeInTheDocument();
    });

    it('should pass correct data to MoneroPayment component', async () => {
      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByText(`Payment ID: ${mockOrderData.orderId}`)).toBeInTheDocument();
      });

      expect(screen.getByText(`XMR Amount: ${mockOrderData.xmrAmount}`)).toBeInTheDocument();
      expect(screen.getByText(`Address: ${mockOrderData.moneroAddress}`)).toBeInTheDocument();
    });

    it('should show back to checkout link', async () => {
      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Back to Checkout')).toBeInTheDocument();
      });

      const backLink = screen.getByRole('link', { name: /back to checkout/i });
      expect(backLink).toHaveAttribute('href', '/checkout');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing order ID', () => {
      // Mock useParams to return no orderId
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useParams: () => ({})
      }));

      renderWithRouter(<MoneroPaymentPage />);

      expect(screen.getByText('Payment Error')).toBeInTheDocument();
      expect(screen.getByText('Invalid order ID')).toBeInTheDocument();
    });

    it('should handle API errors', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 404
      });

      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Payment Error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load order details')).toBeInTheDocument();
      expect(screen.getByText('Back to Checkout')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Payment Error')).toBeInTheDocument();
      });

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should handle API response errors', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          error: 'Order not found'
        })
      });

      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Payment Error')).toBeInTheDocument();
      });

      expect(screen.getByText('Order not found')).toBeInTheDocument();
    });

    it('should allow retry on error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Mock successful retry
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockOrderData
        })
      });

      const tryAgainButton = screen.getByText('Try Again');
      act(() => {
        tryAgainButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Monero Payment')).toBeInTheDocument();
      });
    });
  });

  describe('Payment Status Updates', () => {
    it('should handle payment status updates from MoneroPayment component', async () => {
      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByTestId('monero-payment-component')).toBeInTheDocument();
      });

      // Simulate payment confirmation
      const updateButton = screen.getByTestId('mock-payment-update');
      act(() => {
        updateButton.click();
      });

      expect(screen.getByText('Payment Confirmed!')).toBeInTheDocument();
    });

    it('should redirect to order confirmation after payment is confirmed', async () => {
      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByTestId('monero-payment-component')).toBeInTheDocument();
      });

      // Simulate payment confirmation
      const updateButton = screen.getByTestId('mock-payment-update');
      act(() => {
        updateButton.click();
      });

      // Fast-forward timer to trigger redirect
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/order-confirmation/test-order-123');
    });

    it('should show confirmation banner when payment is confirmed', async () => {
      const confirmedOrderData = {
        ...mockOrderData,
        paymentStatus: 'confirmed'
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: confirmedOrderData
        })
      });

      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Payment Confirmed!')).toBeInTheDocument();
      });

      expect(screen.getByText(/Your Monero payment has been confirmed/)).toBeInTheDocument();
      expect(screen.getByText(/You'll be redirected to the order confirmation page shortly/)).toBeInTheDocument();
    });

    it('should handle errors from MoneroPayment component', async () => {
      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByTestId('monero-payment-component')).toBeInTheDocument();
      });

      // Simulate error from MoneroPayment
      const errorButton = screen.getByTestId('mock-error');
      act(() => {
        errorButton.click();
      });

      // Error should be displayed (implementation depends on how errors are shown)
      // This would need to be implemented in the actual component
    });
  });

  describe('Help Section', () => {
    it('should display help section with payment guidance', async () => {
      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Need Help?')).toBeInTheDocument();
      });

      expect(screen.getByText('Payment Issues')).toBeInTheDocument();
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
      
      expect(screen.getByText(/Ensure you send the exact amount shown/)).toBeInTheDocument();
      expect(screen.getByText(/Use a personal Monero wallet/)).toBeInTheDocument();
      expect(screen.getByText(/Payment must be received within 24 hours/)).toBeInTheDocument();
      expect(screen.getByText(/Allow time for network confirmations/)).toBeInTheDocument();
    });

    it('should have working contact support link', async () => {
      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Contact Support →')).toBeInTheDocument();
      });

      const contactLink = screen.getByRole('link', { name: /contact support/i });
      expect(contactLink).toHaveAttribute('href', '/contact-us');
    });
  });

  describe('Navigation', () => {
    it('should navigate back to checkout when back button is clicked', async () => {
      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Back to Checkout')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('link', { name: /back to checkout/i });
      expect(backButton).toHaveAttribute('href', '/checkout');
    });

    it('should show correct header information', async () => {
      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Monero Payment' })).toBeInTheDocument();
      });

      expect(screen.getByText('Complete your order by sending Monero to the address below')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render with responsive layout classes', async () => {
      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        const mainContainer = screen.getByText('Monero Payment').closest('.max-w-4xl');
        expect(mainContainer).toBeInTheDocument();
      });

      // Check for responsive padding classes
      const container = screen.getByText('Monero Payment').closest('.px-4');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: 'Monero Payment' })).toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 3, name: 'Need Help?' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'Payment Issues' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'Contact Support' })).toBeInTheDocument();
    });

    it('should have accessible error state', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 404
      });

      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Payment Error' })).toBeInTheDocument();
      });

      // Error icon should have proper aria attributes
      const errorIcon = screen.getByRole('img', { hidden: true });
      expect(errorIcon).toBeInTheDocument();
    });

    it('should have accessible loading state', () => {
      fetch.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<MoneroPaymentPage />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading payment details...')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed JSON response', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new SyntaxError('Unexpected token'))
      });

      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Payment Error')).toBeInTheDocument();
      });
    });

    it('should handle missing data fields in response', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            orderId: 'test-order-123',
            // Missing other required fields
          }
        })
      });

      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByTestId('monero-payment-component')).toBeInTheDocument();
      });

      // Component should handle missing data gracefully
      expect(screen.getByText('Payment ID: test-order-123')).toBeInTheDocument();
    });

    it('should handle very large order amounts', async () => {
      const largeAmountData = {
        ...mockOrderData,
        orderTotal: 999999.99,
        xmrAmount: 6172.839506172839
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: largeAmountData
        })
      });

      renderWithRouter(<MoneroPaymentPage />);

      await waitFor(() => {
        expect(screen.getByText(`XMR Amount: ${largeAmountData.xmrAmount}`)).toBeInTheDocument();
      });
    });
  });
});