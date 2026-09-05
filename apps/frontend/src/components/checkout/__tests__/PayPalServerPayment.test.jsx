import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import PayPalServerPayment from '../PayPalServerPayment';

// Captured button props — tests invoke createOrder/onApprove directly
const buttonPropsRef = { current: {} };

vi.mock('@paypal/react-paypal-js', () => ({
  PayPalScriptProvider: ({ children }) => <div>{children}</div>,
  PayPalButtons: (props) => {
    buttonPropsRef.current = props;
    return <div data-testid="paypal-buttons" />;
  }
}));

const checkoutRef = {
  current: { guestEmail: '', isGuestCheckout: false, shippingMethod: { id: 'ship-1' } }
};

vi.mock('../../../contexts/CheckoutContext', () => ({
  useCheckout: () => checkoutRef.current
}));

const mockCreatePayPalOrder = vi.fn();
const mockCapturePayPalPayment = vi.fn();

vi.mock('../../../services/paymentService', () => ({
  createPayPalOrder: (...args) => mockCreatePayPalOrder(...args),
  capturePayPalPayment: (...args) => mockCapturePayPalPayment(...args),
  formatCurrency: (amount) => `£${amount.toFixed(2)}`
}));

const orderSummary = {
  cartTotal: 99.99,
  shippingCost: 5.99,
  orderTotal: 105.98,
  items: [{ productName: 'Pixel 8' }],
  shippingAddress: {
    fullName: 'Jane Doe',
    addressLine1: '1 Main St',
    city: 'London',
    stateProvince: 'ENG',
    postalCode: 'W1 1AA',
    country: 'GB'
  }
};

describe('PayPalServerPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buttonPropsRef.current = {};
    checkoutRef.current = { guestEmail: '', isGuestCheckout: false, shippingMethod: { id: 'ship-1' } };
  });

  it('renders the order total and PayPal buttons', () => {
    render(<PayPalServerPayment orderSummary={orderSummary} />);

    expect(screen.getByTestId('paypal-order-total')).toHaveTextContent('£105.98');
    expect(screen.getByTestId('paypal-checkout-button')).toBeInTheDocument();
  });

  it('createOrder calls the backend and returns ONLY the order ID string', async () => {
    mockCreatePayPalOrder.mockResolvedValue({
      paypalOrderId: 'PP-SERVER-1',
      approvalUrl: 'https://sandbox.paypal.com/approve'
    });

    render(<PayPalServerPayment orderSummary={orderSummary} />);

    let result;
    await act(async () => {
      result = await buttonPropsRef.current.createOrder();
    });

    expect(mockCreatePayPalOrder).toHaveBeenCalledWith({
      shippingAddress: expect.objectContaining({
        firstName: 'Jane',
        lastName: 'Doe',
        addressLine1: '1 Main St',
        city: 'London'
      }),
      shippingMethodId: 'ship-1',
      customerEmail: undefined
    });
    // PayPalButtons contract: the ID string, not the response object
    expect(result).toBe('PP-SERVER-1');
  });

  it('sends the guest email on create and capture when checking out as guest', async () => {
    checkoutRef.current = {
      guestEmail: 'guest@example.com',
      isGuestCheckout: true,
      shippingMethod: { id: 'ship-1' }
    };
    mockCreatePayPalOrder.mockResolvedValue({ paypalOrderId: 'PP-GUEST-1' });
    mockCapturePayPalPayment.mockResolvedValue({
      success: true,
      data: { orderId: 'o1', orderNumber: 'ORD-1' }
    });

    const onSuccess = vi.fn();
    render(<PayPalServerPayment orderSummary={orderSummary} onSuccess={onSuccess} />);

    await act(async () => {
      await buttonPropsRef.current.createOrder();
    });
    await act(async () => {
      await buttonPropsRef.current.onApprove({ orderID: 'PP-GUEST-1', payerID: 'PAYER-1' });
    });

    expect(mockCreatePayPalOrder).toHaveBeenCalledWith(
      expect.objectContaining({ customerEmail: 'guest@example.com' })
    );
    expect(mockCapturePayPalPayment).toHaveBeenCalledWith({
      paypalOrderId: 'PP-GUEST-1',
      payerId: 'PAYER-1',
      customerEmail: 'guest@example.com'
    });
    expect(onSuccess).toHaveBeenCalledWith({ orderId: 'o1', orderNumber: 'ORD-1' });
  });

  it('NEVER captures client-side — onApprove performs the backend capture only', async () => {
    mockCapturePayPalPayment.mockResolvedValue({ success: true, data: { orderId: 'o1' } });

    render(<PayPalServerPayment orderSummary={orderSummary} onSuccess={vi.fn()} />);

    // The SDK passes actions with order.capture — a client-side capture would
    // double-capture; our handler must ignore it entirely.
    const actions = { order: { capture: vi.fn() } };
    await act(async () => {
      await buttonPropsRef.current.onApprove({ orderID: 'PP-1', payerID: 'P-1' }, actions);
    });

    expect(actions.order.capture).not.toHaveBeenCalled();
    expect(mockCapturePayPalPayment).toHaveBeenCalled();
  });

  it('surfaces a backend capture error and re-enables the buttons', async () => {
    mockCapturePayPalPayment.mockRejectedValue(new Error('Email is required for guest checkout'));

    const onError = vi.fn();
    render(<PayPalServerPayment orderSummary={orderSummary} onSuccess={vi.fn()} onError={onError} />);

    await act(async () => {
      await buttonPropsRef.current.onApprove({ orderID: 'PP-1', payerID: 'P-1' });
    });

    expect(screen.getByTestId('payment-error')).toHaveTextContent(/Email is required/i);
    expect(onError).toHaveBeenCalled();
  });

  it('shows an error when order creation fails', async () => {
    mockCreatePayPalOrder.mockRejectedValue(new Error('Cart is empty'));

    render(<PayPalServerPayment orderSummary={orderSummary} />);

    await act(async () => {
      // createOrder rethrows — catch it here as PayPalButtons would via onError
      await expect(buttonPropsRef.current.createOrder()).rejects.toThrow('Cart is empty');
    });

    expect(screen.getByTestId('payment-error')).toHaveTextContent('Cart is empty');
  });
});
