import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { CartProvider } from '../../contexts/CartContext';
import { CheckoutProvider } from '../../contexts/CheckoutContext';
import App from '../../App';

// Mock all external dependencies
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,mockedqrcode'))
}));

jest.mock('../../services/paymentService', () => ({
  formatCurrency: jest.fn((amount) => `£${amount.toFixed(2)}`),
  getPaymentMethods: jest.fn(() => Promise.resolve({
    paymentMethods: [
      {
        id: 'paypal',
        type: 'paypal',
        name: 'PayPal',
        description: 'Pay securely with PayPal'
      },
      {
        id: 'monero',
        type: 'monero',
        name: 'Monero (XMR)',
        description: 'Private cryptocurrency payment'
      }
    ]
  }))
}));

// Mock cart service
jest.mock('../../services/cartService', () => ({
  getCart: jest.fn(() => Promise.resolve({
    items: [
      {
        _id: 'item1',
        product: {
          _id: 'product1',
          name: 'GrapheneOS Pixel 7',
          price: 599.99,
          images: ['pixel7.jpg']
        },
        quantity: 1
      }
    ],
    cartTotal: 599.99
  })),
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  clearCart: jest.fn(),
  formatCurrency: jest.fn((amount) => `£${amount.toFixed(2)}`)
}));

// Mock order service
jest.mock('../../services/orderService', () => ({
  placeOrder: jest.fn(() => Promise.resolve({
    success: true,
    data: {
      order: {
        _id: 'order-123',
        orderNumber: 'ORD-2024-001'
      }
    }
  })),
  validateOrderData: jest.fn(() => ({ isValid: true, errors: [] }))
}));

// Mock shipping service
jest.mock('../../services/shippingService', () => ({
  getShippingMethods: jest.fn(() => Promise.resolve([
    {
      _id: 'standard',
      name: 'Standard Shipping',
      cost: 9.99,
      estimatedDays: '5-7'
    }
  ]))
}));

// Mock authentication
const mockUser = {
  _id: 'user123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com'
};

jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    isAuthenticated: true,
    user: mockUser,
    isLoading: false
  }),
  useLogout: () => jest.fn()
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Monero Payment End-to-End Flow', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup default fetch responses
    fetch.mockImplementation((url) => {
      if (url.includes('/api/payments/monero/create')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              orderId: 'order-123',
              moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
              xmrAmount: 3.7037037037,
              orderTotal: 609.98,
              exchangeRate: 0.00607477,
              expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              validUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
              requiredConfirmations: 10,
              paymentWindowHours: 24,
              status: 'pending'
            }
          })
        });
      }
      
      if (url.includes('/api/payments/monero/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              orderId: 'order-123',
              paymentStatus: 'pending',
              confirmations: 0,
              moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
              xmrAmount: 3.7037037037,
              exchangeRate: 0.00607477,
              isExpired: false
            }
          })
        });
      }

      // Default fallback
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      });
    });

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve())
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderApp = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <CheckoutProvider>
              <App />
            </CheckoutProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Complete Monero Payment Journey', () => {
    it('should complete entire flow from cart to payment confirmation', async () => {
      renderApp();

      // 1. Start at products page (default route)
      await waitFor(() => {
        expect(screen.getByText('GrapheneOS Store')).toBeInTheDocument();
      });

      // 2. Navigate to cart (simulate having items)
      const cartIcon = screen.getByRole('link', { name: /cart/i });
      await user.click(cartIcon);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/cart');
      });

      // 3. Proceed to checkout
      const checkoutButton = screen.getByRole('button', { name: /proceed to checkout/i });
      await user.click(checkoutButton);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/checkout');
      });

      // 4. Fill in shipping address
      await waitFor(() => {
        expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      });

      const fullNameInput = screen.getByLabelText(/full name/i);
      const addressInput = screen.getByLabelText(/address line 1/i);
      const cityInput = screen.getByLabelText(/city/i);
      const postalCodeInput = screen.getByLabelText(/postal code/i);

      await user.type(fullNameInput, 'John Doe');
      await user.type(addressInput, '123 Test Street');
      await user.type(cityInput, 'London');
      await user.type(postalCodeInput, 'SW1A 1AA');

      // Continue to payment method
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      // 5. Select Monero payment method
      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
      });

      const moneroOption = screen.getByLabelText(/monero.*xmr/i);
      await user.click(moneroOption);

      await waitFor(() => {
        expect(screen.getByText('Monero Payment Process')).toBeInTheDocument();
      });

      // 6. Complete order
      const placeOrderButton = screen.getByRole('button', { name: /place order/i });
      await user.click(placeOrderButton);

      // 7. Should redirect to Monero payment page
      await waitFor(() => {
        expect(window.location.pathname).toBe('/payment/monero/order-123');
      });

      // 8. Verify Monero payment page content
      await waitFor(() => {
        expect(screen.getByText('Monero Payment')).toBeInTheDocument();
      });

      expect(screen.getByText('Complete your order by sending Monero to the address below')).toBeInTheDocument();
      expect(screen.getByText('Payment Instructions')).toBeInTheDocument();
      expect(screen.getByText('Scan QR Code')).toBeInTheDocument();

      // 9. Verify payment details are displayed
      expect(screen.getByDisplayValue(/4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q/)).toBeInTheDocument();
      expect(screen.getByDisplayValue('3.7037037037')).toBeInTheDocument();

      // 10. Test copy functionality
      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      await user.click(copyButtons[0]); // Copy address

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q'
      );

      await waitFor(() => {
        expect(screen.getByText('Address copied!')).toBeInTheDocument();
      });
    });

    it('should handle payment status updates and redirect on confirmation', async () => {
      renderApp();

      // Navigate directly to payment page
      window.history.pushState({}, '', '/payment/monero/order-123');

      await waitFor(() => {
        expect(screen.getByText('Monero Payment')).toBeInTheDocument();
      });

      // Simulate payment confirmation by updating fetch mock
      fetch.mockImplementation((url) => {
        if (url.includes('/api/payments/monero/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                orderId: 'order-123',
                paymentStatus: 'confirmed',
                confirmations: 12,
                moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
                xmrAmount: 3.7037037037,
                exchangeRate: 0.00607477,
                isExpired: false
              }
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} })
        });
      });

      // Wait for status polling to pick up the confirmation
      act(() => {
        jest.advanceTimersByTime(30000); // Advance 30 seconds for polling
      });

      await waitFor(() => {
        expect(screen.getByText('Payment Confirmed!')).toBeInTheDocument();
      });

      // Should show redirect message
      expect(screen.getByText(/You'll be redirected to the order confirmation page shortly/)).toBeInTheDocument();

      // Advance timer to trigger redirect
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(window.location.pathname).toBe('/order-confirmation/order-123');
      });
    });

    it('should handle underpaid payments correctly', async () => {
      renderApp();

      window.history.pushState({}, '', '/payment/monero/order-123');

      await waitFor(() => {
        expect(screen.getByText('Monero Payment')).toBeInTheDocument();
      });

      // Mock underpaid status
      fetch.mockImplementation((url) => {
        if (url.includes('/api/payments/monero/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                orderId: 'order-123',
                paymentStatus: 'underpaid',
                confirmations: 5,
                moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
                xmrAmount: 3.7037037037,
                exchangeRate: 0.00607477,
                isExpired: false
              }
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} })
        });
      });

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(screen.getByText('Payment Underpaid - Please send the full amount')).toBeInTheDocument();
      });
    });

    it('should handle expired payments', async () => {
      renderApp();

      window.history.pushState({}, '', '/payment/monero/order-123');

      // Mock expired payment
      fetch.mockImplementation((url) => {
        if (url.includes('/api/payments/monero/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                orderId: 'order-123',
                paymentStatus: 'pending',
                confirmations: 0,
                moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
                xmrAmount: 3.7037037037,
                exchangeRate: 0.00607477,
                isExpired: true
              }
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} })
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Monero Payment')).toBeInTheDocument();
      });

      // Should not show redirect after expiration
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Payment should still be shown but expired
      expect(screen.getByText('Monero Payment')).toBeInTheDocument();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle order creation failures', async () => {
      // Mock order creation failure
      const orderService = require('../../services/orderService');
      orderService.placeOrder.mockRejectedValue(new Error('Payment service unavailable'));

      renderApp();
      window.history.pushState({}, '', '/checkout');

      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
      });

      const moneroOption = screen.getByLabelText(/monero.*xmr/i);
      await user.click(moneroOption);

      const placeOrderButton = screen.getByRole('button', { name: /place order/i });
      await user.click(placeOrderButton);

      await waitFor(() => {
        expect(screen.getByText(/Payment service unavailable/)).toBeInTheDocument();
      });

      // Should remain on checkout page
      expect(window.location.pathname).toBe('/checkout');
    });

    it('should handle payment API failures', async () => {
      renderApp();
      window.history.pushState({}, '', '/payment/monero/order-123');

      // Mock API failure
      fetch.mockRejectedValue(new Error('Network error'));

      await waitFor(() => {
        expect(screen.getByText('Payment Error')).toBeInTheDocument();
      });

      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should handle QR code generation failures gracefully', async () => {
      const QRCode = require('qrcode');
      QRCode.toDataURL.mockRejectedValue(new Error('QR generation failed'));

      renderApp();
      window.history.pushState({}, '', '/payment/monero/order-123');

      await waitFor(() => {
        expect(screen.getByText('Monero Payment')).toBeInTheDocument();
      });

      // Should still show the payment page with loading QR code area
      expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    });
  });

  describe('User Experience Features', () => {
    it('should display correct countdown timer', async () => {
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      
      fetch.mockImplementation((url) => {
        if (url.includes('/api/payments/monero/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                orderId: 'order-123',
                paymentStatus: 'pending',
                confirmations: 0,
                moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
                xmrAmount: 3.7037037037,
                exchangeRate: 0.00607477,
                expirationTime: futureTime.toISOString(),
                isExpired: false
              }
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      renderApp();
      window.history.pushState({}, '', '/payment/monero/order-123');

      await waitFor(() => {
        expect(screen.getByText(/Time remaining: 2h 0m/)).toBeInTheDocument();
      });
    });

    it('should show payment instructions clearly', async () => {
      renderApp();
      window.history.pushState({}, '', '/payment/monero/order-123');

      await waitFor(() => {
        expect(screen.getByText('Payment Instructions')).toBeInTheDocument();
      });

      expect(screen.getByText(/Send exactly/)).toBeInTheDocument();
      expect(screen.getByText(/Payment will be confirmed after 10 network confirmations/)).toBeInTheDocument();
      expect(screen.getByText(/Do not close this page until payment is confirmed/)).toBeInTheDocument();
    });

    it('should provide helpful error recovery options', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      renderApp();
      window.history.pushState({}, '', '/payment/monero/order-123');

      await waitFor(() => {
        expect(screen.getByText('Payment Error')).toBeInTheDocument();
      });

      expect(screen.getByText('Back to Checkout')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();

      // Test retry functionality
      const tryAgainButton = screen.getByText('Try Again');
      
      // Mock successful retry
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            orderId: 'order-123',
            paymentStatus: 'pending',
            moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
            xmrAmount: 3.7037037037
          }
        })
      });

      await user.click(tryAgainButton);

      await waitFor(() => {
        expect(screen.getByText('Monero Payment')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should handle multiple rapid status checks without issues', async () => {
      renderApp();
      window.history.pushState({}, '', '/payment/monero/order-123');

      await waitFor(() => {
        expect(screen.getByText('Monero Payment')).toBeInTheDocument();
      });

      // Rapid fire multiple status checks
      for (let i = 0; i < 5; i++) {
        act(() => {
          jest.advanceTimersByTime(30000);
        });
      }

      // Should still be functional
      expect(screen.getByText('Monero Payment')).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledTimes(6); // Initial + 5 polling calls
    });

    it('should clean up timers on navigation away', async () => {
      renderApp();
      window.history.pushState({}, '', '/payment/monero/order-123');

      await waitFor(() => {
        expect(screen.getByText('Monero Payment')).toBeInTheDocument();
      });

      // Navigate away
      window.history.pushState({}, '', '/products');

      // Advance timers - should not cause errors
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should have navigated successfully
      await waitFor(() => {
        expect(window.location.pathname).toBe('/products');
      });
    });
  });
});