import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import PayPalPayment from '../PayPalPayment';

// Mock PayPal SDK
vi.mock('@paypal/react-paypal-js', () => {
  const mockPayPalButtons = vi.fn();
  const mockPayPalScriptProvider = vi.fn(({ children }) => <div data-testid="paypal-script-provider">{children}</div>);
  
  return {
    PayPalButtons: mockPayPalButtons,
    PayPalScriptProvider: mockPayPalScriptProvider
  };
});

// Mock payment service
vi.mock('../../../services/paymentService', () => ({
  formatCurrency: vi.fn((amount) => `£${amount.toFixed(2)}`)
}));

// Mock environment variables
vi.stubGlobal('import.meta', {
  env: {
    VITE_PAYPAL_CLIENT_ID: 'test-paypal-client-id'
  }
});

describe('PayPalPayment Component', () => {
  const mockOrderSummary = {
    orderTotal: 299.99,
    cartTotal: 289.99,
    shippingCost: 10.00,
    items: [
      {
        name: 'Test Product',
        quantity: 1,
        unitPrice: 289.99,
        totalPrice: 289.99
      }
    ]
  };

  const mockCallbacks = {
    onPaymentSuccess: vi.fn(),
    onPaymentError: vi.fn(),
    onPaymentCancel: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked functions
    const { PayPalButtons } = await vi.importMock('@paypal/react-paypal-js');
    
    // Mock PayPal buttons to render a simple button for testing
    PayPalButtons.mockImplementation(({ createOrder, onApprove, onError, onCancel, disabled }) => (
      <div data-testid="paypal-buttons">
        <button
          data-testid="paypal-pay-button"
          onClick={() => {
            // Simulate PayPal flow
            const mockOrderId = 'MOCK_ORDER_123';
            createOrder({}, {
              order: {
                create: vi.fn().mockResolvedValue(mockOrderId)
              }
            }).then(() => {
              onApprove({ orderID: mockOrderId, payerID: 'PAYER_123' }, {
                order: {
                  capture: vi.fn().mockResolvedValue({
                    id: mockOrderId,
                    status: 'COMPLETED',
                    payer: { email_address: 'test@example.com' }
                  })
                }
              });
            });
          }}
          disabled={disabled}
        >
          Pay with PayPal
        </button>
        <button
          data-testid="paypal-error-button"
          onClick={() => onError(new Error('Payment failed'))}
        >
          Simulate Error
        </button>
        <button
          data-testid="paypal-cancel-button"
          onClick={() => onCancel({ orderID: 'CANCELLED_ORDER' })}
        >
          Cancel Payment
        </button>
      </div>
    ));
  });

  it('renders PayPal payment component with order summary', () => {
    render(
      <PayPalPayment
        orderSummary={mockOrderSummary}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('£299.99')).toBeInTheDocument();
    expect(screen.getByText('1 item(s)')).toBeInTheDocument();
    expect(screen.getByText('Subtotal:')).toBeInTheDocument();
    expect(screen.getByText('£289.99')).toBeInTheDocument();
    expect(screen.getByText('Shipping:')).toBeInTheDocument();
    expect(screen.getByText('£10.00')).toBeInTheDocument();
  });

  it('renders PayPal buttons', () => {
    render(
      <PayPalPayment
        orderSummary={mockOrderSummary}
        {...mockCallbacks}
      />
    );

    expect(screen.getByTestId('paypal-script-provider')).toBeInTheDocument();
    expect(screen.getByTestId('paypal-buttons')).toBeInTheDocument();
    expect(screen.getByTestId('paypal-pay-button')).toBeInTheDocument();
  });

  it('calls onPaymentSuccess when PayPal payment succeeds', async () => {
    render(
      <PayPalPayment
        orderSummary={mockOrderSummary}
        {...mockCallbacks}
      />
    );

    const payButton = screen.getByTestId('paypal-pay-button');
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(mockCallbacks.onPaymentSuccess).toHaveBeenCalledWith({
        orderId: 'MOCK_ORDER_123',
        payerId: 'PAYER_123',
        paymentDetails: {
          id: 'MOCK_ORDER_123',
          status: 'COMPLETED',
          payer: { email_address: 'test@example.com' }
        },
        paymentMethod: 'paypal'
      });
    });
  });

  it('calls onPaymentError when PayPal payment fails', async () => {
    render(
      <PayPalPayment
        orderSummary={mockOrderSummary}
        {...mockCallbacks}
      />
    );

    const errorButton = screen.getByTestId('paypal-error-button');
    fireEvent.click(errorButton);

    await waitFor(() => {
      expect(mockCallbacks.onPaymentError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Payment failed' })
      );
    });
  });

  it('calls onPaymentCancel when PayPal payment is cancelled', async () => {
    render(
      <PayPalPayment
        orderSummary={mockOrderSummary}
        {...mockCallbacks}
      />
    );

    const cancelButton = screen.getByTestId('paypal-cancel-button');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockCallbacks.onPaymentCancel).toHaveBeenCalledWith({
        orderID: 'CANCELLED_ORDER'
      });
    });
  });

  it('displays error message when payment fails', async () => {
    render(
      <PayPalPayment
        orderSummary={mockOrderSummary}
        {...mockCallbacks}
      />
    );

    const errorButton = screen.getByTestId('paypal-error-button');
    fireEvent.click(errorButton);

    await waitFor(() => {
      expect(screen.getByText('Payment failed. Please try again or choose a different payment method.')).toBeInTheDocument();
    });
  });

  it('shows loading state when no order summary is provided', () => {
    render(
      <PayPalPayment
        orderSummary={null}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Loading payment information...')).toBeInTheDocument();
  });

  it('displays processing indicator during payment', async () => {
    render(
      <PayPalPayment
        orderSummary={mockOrderSummary}
        {...mockCallbacks}
      />
    );

    const payButton = screen.getByTestId('paypal-pay-button');
    fireEvent.click(payButton);

    // Should show processing state
    expect(screen.getByText('Processing payment...')).toBeInTheDocument();
  });

  it('disables buttons during processing', async () => {
    render(
      <PayPalPayment
        orderSummary={mockOrderSummary}
        {...mockCallbacks}
      />
    );

    const payButton = screen.getByTestId('paypal-pay-button');
    fireEvent.click(payButton);

    // PayPal buttons should be disabled during processing
    const { PayPalButtons } = await vi.importMock('@paypal/react-paypal-js');
    
    // Check the last call (during processing)
    const lastCall = PayPalButtons.mock.calls[PayPalButtons.mock.calls.length - 1];
    expect(lastCall[0]).toMatchObject({ disabled: true });
  });

  it('renders security information', () => {
    render(
      <PayPalPayment
        orderSummary={mockOrderSummary}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Secure PayPal Payment')).toBeInTheDocument();
    expect(screen.getByText(/Your financial information is never shared with us/)).toBeInTheDocument();
  });

  it('configures PayPal with correct options', async () => {
    render(
      <PayPalPayment
        orderSummary={mockOrderSummary}
        {...mockCallbacks}
      />
    );

    const { PayPalScriptProvider } = await vi.importMock('@paypal/react-paypal-js');
    
    // Check the call arguments
    const firstCall = PayPalScriptProvider.mock.calls[0];
    expect(firstCall[0].options).toMatchObject({
      'client-id': 'test', // Falls back to 'test' when env var not available
      currency: 'GBP',
      intent: 'capture',
      components: 'buttons',
      'disable-funding': 'credit,card'
    });
  });
});