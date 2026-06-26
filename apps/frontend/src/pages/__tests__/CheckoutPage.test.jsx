import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import CheckoutPage from '../CheckoutPage';
import { AuthStateContext, AuthDispatchContext } from '../../contexts/AuthContext';
import { CartContext } from '../../contexts/CartContext';
import { CheckoutContext } from '../../contexts/CheckoutContext';

// Mock cartService only for formatCurrency (used by CartSummary/ReviewSection).
vi.mock('../../services/cartService', () => ({
  formatCurrency: vi.fn((amount) => `£${Number(amount).toFixed(2)}`)
}));

// Mock the payment-step sub-components to keep rendering stable without their
// internal data-loading needs. Only the test file is edited.
vi.mock('../../components/checkout/ShippingAddressSection', () => ({
  default: () => <div>Shipping Address Section</div>
}));
vi.mock('../../components/checkout/BillingAddressSection', () => ({
  default: () => <div>Billing Address Section</div>
}));
vi.mock('../../components/checkout/PaymentMethodSection', () => ({
  default: () => <div>Payment Method Section</div>
}));
vi.mock('../../components/checkout/PayPalPayment', () => ({
  default: (props) => (
    <div data-testid="paypal-payment">
      <button onClick={() => props.onPaymentSuccess && props.onPaymentSuccess({})}>
        PayPal Commit
      </button>
    </div>
  )
}));

const mockCart = {
  items: [
    {
      _id: 'item1',
      productId: 'prod1',
      productName: 'GrapheneOS Pixel 9',
      productImage: 'https://example.com/pixel9.jpg',
      unitPrice: 899.99,
      quantity: 1,
      subtotal: 899.99
    },
    {
      _id: 'item2',
      productId: 'prod2',
      productName: 'GrapheneOS Pixel 9 Pro',
      productImage: 'https://example.com/pixel9pro.jpg',
      unitPrice: 999.99,
      quantity: 2,
      subtotal: 1999.98
    }
  ],
  totalItems: 3,
  totalAmount: 2899.97,
  itemCount: 3
};

const mockAddress = {
  fullName: 'John Doe',
  addressLine1: '123 Main St',
  addressLine2: '',
  city: 'Anytown',
  stateProvince: 'CA',
  postalCode: '12345',
  country: 'USA',
  phoneNumber: '555-1234'
};

const defaultAuthState = {
  user: { name: 'Test User' },
  isAuthenticated: true,
  isLoading: false,
  error: null
};

function buildCartContext(overrides = {}) {
  return {
    cart: mockCart,
    loading: false,
    error: '',
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
    refreshCart: vi.fn(),
    clearError: vi.fn(),
    isEmpty: false,
    itemCount: mockCart.itemCount,
    ...overrides
  };
}

function buildCheckoutContext(overrides = {}) {
  const shippingMethod = {
    name: 'Standard Shipping',
    cost: 9.99,
    estimatedDelivery: '3-5 days',
    description: 'Tracked',
    isFreeShipping: false
  };
  return {
    checkoutState: {
      step: 'payment',
      deliveryAddress: null,
      shippingAddress: mockAddress,
      billingAddress: mockAddress,
      useSameAsShipping: true,
      shippingMethod,
      shippingCost: 9.99,
      paymentMethod: null,
      orderNotes: ''
    },
    paymentState: { isProcessing: false, error: null, paymentData: null },
    addresses: [],
    addressesLoading: false,
    addressesError: '',
    shippingRates: [],
    shippingRatesLoading: false,
    shippingRatesError: '',

    setDeliveryAddress: vi.fn(),
    setShippingAddress: vi.fn(),
    setBillingAddress: vi.fn(),
    setUseSameAsShipping: vi.fn(),
    setShippingMethod: vi.fn(),
    setPaymentMethod: vi.fn(),
    setPaymentState: vi.fn(),
    setOrderNotes: vi.fn(),
    goToStep: vi.fn(),
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    resetCheckout: vi.fn(),
    refreshAddresses: vi.fn(),
    refreshShippingRates: vi.fn(),

    canProceedToReview: true,
    isPaymentStep: true,
    isReviewStep: false,

    subtotal: 2899.97,
    shippingCost: 9.99,
    orderTotal: 2909.96,
    orderSummary: {
      cartTotal: 2899.97,
      shippingCost: 9.99,
      orderTotal: 2909.96,
      currency: 'GBP',
      items: mockCart.items,
      shippingMethod,
      shippingAddress: mockAddress,
      billingAddress: mockAddress,
      deliveryAddress: null
    },

    deliveryAddress: null,
    shippingAddress: mockAddress,
    billingAddress: mockAddress,
    useSameAsShipping: true,
    shippingMethod,
    paymentMethod: null,
    orderNotes: '',
    ...overrides
  };
}

function renderCheckout({
  authState = defaultAuthState,
  authDispatch = vi.fn(),
  cart = {},
  checkout = {},
  loading
} = {}) {
  const cartValue = buildCartContext(
    loading !== undefined ? { loading, cart: { items: [] } } : cart
  );
  const checkoutValue = buildCheckoutContext(checkout);
  const authValue = loading !== undefined ? { ...authState, isLoading: loading } : authState;

  function Wrapper({ children }) {
    return (
      <HelmetProvider>
        <MemoryRouter initialEntries={['/checkout']}>
          <AuthStateContext.Provider value={authValue}>
            <AuthDispatchContext.Provider value={authDispatch}>
              <CartContext.Provider value={cartValue}>
                <CheckoutContext.Provider value={checkoutValue}>
                  {children}
                </CheckoutContext.Provider>
              </CartContext.Provider>
            </AuthDispatchContext.Provider>
          </AuthStateContext.Provider>
        </MemoryRouter>
      </HelmetProvider>
    );
  }

  return { ...render(<CheckoutPage />, { wrapper: Wrapper }), checkoutValue, cartValue };
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = '';
  });

  describe('Page Rendering', () => {
    it('should render checkout page with proper title', () => {
      renderCheckout();

      expect(document.title).toBe('Checkout - Graphene Security');
      expect(
        screen.getByRole('heading', { name: /^checkout$/i })
      ).toBeInTheDocument();
    });

    it('should render checkout steps', () => {
      renderCheckout();

      expect(screen.getByText('Shipping & Payment')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    it('should render cart summary', () => {
      renderCheckout();

      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('GrapheneOS Pixel 9')).toBeInTheDocument();
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });
  });

  describe('Authentication States', () => {
    it('should show loading state while checking auth', () => {
      renderCheckout({
        authState: { ...defaultAuthState, isLoading: true }
      });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show login prompt for unauthenticated users', () => {
      renderCheckout({
        authState: { ...defaultAuthState, isAuthenticated: false, user: null }
      });

      expect(screen.getByText('Login Required')).toBeInTheDocument();
      expect(
        screen.getByText('You need to be logged in to proceed with checkout.')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /login to continue/i })
      ).toBeInTheDocument();
    });

    it('should show empty cart message when cart is empty', () => {
      renderCheckout({
        cart: {
          cart: { items: [], totalItems: 0, totalAmount: 0, itemCount: 0 },
          isEmpty: true
        }
      });

      expect(screen.getByText('Your Cart is Empty')).toBeInTheDocument();
      expect(
        screen.getByText('Add some items to your cart before proceeding to checkout.')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /continue shopping/i })
      ).toBeInTheDocument();
    });
  });

  describe('Payment Step', () => {
    it('should render payment method heading on payment step', () => {
      renderCheckout();

      // Exact match: the heading is "Payment Method" (placeholder is "Payment Method Section")
      expect(
        screen.getByRole('heading', { name: /^payment method$/i })
      ).toBeInTheDocument();
      expect(screen.getByText('Shipping Address Section')).toBeInTheDocument();
      expect(screen.getByText('Billing Address Section')).toBeInTheDocument();
    });

    it('should show continue to review button enabled when canProceedToReview is true', () => {
      renderCheckout({ checkout: { canProceedToReview: true } });

      const button = screen.getByTestId('checkout-button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent(/continue to review/i);
    });

    it('should disable continue to review button when canProceedToReview is false', () => {
      renderCheckout({ checkout: { canProceedToReview: false } });

      const button = screen.getByTestId('checkout-button');
      expect(button).toBeDisabled();
    });

    it('should call nextStep when continue to review is clicked', () => {
      const { checkoutValue } = renderCheckout();

      const button = screen.getByTestId('checkout-button');
      fireEvent.click(button);

      expect(checkoutValue.nextStep).toHaveBeenCalledTimes(1);
    });
  });

  describe('Step Navigation', () => {
    it('should highlight current step with text-cyan-400', () => {
      renderCheckout();

      const stepLabel = screen.getByText('Shipping & Payment');
      const container = stepLabel.closest('div.flex.items-center');
      expect(container).toHaveClass('text-cyan-400');
    });

    it('should render review step content when step is review', () => {
      renderCheckout({
        checkout: {
          checkoutState: {
            step: 'review',
            deliveryAddress: null,
            shippingAddress: mockAddress,
            billingAddress: mockAddress,
            useSameAsShipping: true,
            shippingMethod: {
              name: 'Standard Shipping',
              cost: 9.99,
              estimatedDelivery: '3-5 days',
              isFreeShipping: false
            },
            shippingCost: 9.99,
            paymentMethod: null,
            orderNotes: ''
          },
          isPaymentStep: false,
          isReviewStep: true
        }
      });

      expect(screen.getByText('Review Your Order')).toBeInTheDocument();
      expect(screen.getByText('Order Items')).toBeInTheDocument();
      // Selected shipping address full name appears in review
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    });

    it('should call prevStep when back button is clicked in review step', () => {
      const { checkoutValue } = renderCheckout({
        checkout: {
          checkoutState: {
            step: 'review',
            deliveryAddress: null,
            shippingAddress: mockAddress,
            billingAddress: mockAddress,
            useSameAsShipping: true,
            shippingMethod: {
              name: 'Standard Shipping',
              cost: 9.99,
              estimatedDelivery: '3-5 days',
              isFreeShipping: false
            },
            shippingCost: 9.99,
            paymentMethod: null,
            orderNotes: ''
          },
          isPaymentStep: false,
          isReviewStep: true
        }
      });

      const backButton = screen.getByRole('button', {
        name: /back to shipping & payment/i
      });
      fireEvent.click(backButton);

      expect(checkoutValue.prevStep).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle cart loading state', () => {
      renderCheckout({
        cart: {
          cart: { items: [], totalItems: 0, totalAmount: 0, itemCount: 0 },
          loading: true
        }
      });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render properly on different screen sizes', () => {
      renderCheckout();

      const container = document.querySelector('.checkout-page');
      expect(container).toBeInTheDocument();

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });
  });

  describe('Order Review', () => {
    const reviewProps = {
      checkout: {
        checkoutState: {
          step: 'review',
          deliveryAddress: null,
          shippingAddress: mockAddress,
          billingAddress: mockAddress,
          useSameAsShipping: true,
          shippingMethod: {
            name: 'Standard Shipping',
            cost: 9.99,
            estimatedDelivery: '3-5 days',
            isFreeShipping: false
          },
          shippingCost: 9.99,
          paymentMethod: null,
          orderNotes: ''
        },
        isPaymentStep: false,
        isReviewStep: true
      }
    };

    it('should display selected shipping address in review', () => {
      renderCheckout(reviewProps);

      expect(screen.getByText('Review Your Order')).toBeInTheDocument();
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getAllByText('123 Main St').length).toBeGreaterThan(0);
    });

    it('should show PayPal commit button in review step', () => {
      renderCheckout({
        ...reviewProps,
        checkout: {
          ...reviewProps.checkout,
          paymentMethod: { id: 'paypal', type: 'paypal', name: 'PayPal' }
        }
      });

      expect(screen.getByTestId('paypal-checkout-section')).toBeInTheDocument();
      expect(screen.getByTestId('paypal-payment')).toBeInTheDocument();
    });
  });
});
