import React from 'react';
import { render, screen, waitFor, userEvent, act } from '../../test/test-utils';
// Raw RTL render, with NO provider wrapper, for the "used outside provider" test.
import { render as renderBare } from '@testing-library/react';
import { CheckoutProvider, useCheckout } from '../CheckoutContext';

// Mock addressService and AuthContext
import { vi } from 'vitest';

vi.mock('../../services/addressService', () => ({
  getUserAddresses: vi.fn()
}));

vi.mock('../AuthContext', () => ({
  useAuth: vi.fn(),
  useLogin: vi.fn(),
  useAuthState: vi.fn(() => ({ user: null, isAuthenticated: false, isLoading: false })),
  useAuthDispatch: vi.fn(() => vi.fn()),
  AuthProvider: ({ children }) => children,
  AuthStateContext: React.createContext(),
  AuthDispatchContext: React.createContext()
}));

vi.mock('../CartContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useCart: vi.fn().mockReturnValue({
      cart: { items: [], totalAmount: 0, totalItems: 0 },
      loading: false,
      error: ''
    })
  };
});

import { getUserAddresses } from '../../services/addressService';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';

// useCart() return value used by CheckoutProvider. vi.clearAllMocks() (in
// beforeEach) wipes mockReturnValue, so re-establish it there.
const cartReturnValue = {
  cart: { items: [], totalAmount: 0, totalItems: 0 },
  loading: false,
  error: ''
};

// Test component that uses checkout context
const TestComponent = () => {
  const {
    checkoutState,
    addresses,
    addressesLoading,
    addressesError,
    setShippingAddress,
    setShippingMethod,
    setPaymentMethod,
    setOrderNotes,
    goToStep,
    nextStep,
    prevStep,
    resetCheckout,
    refreshAddresses,
    canProceedToReview,
    isPaymentStep,
    isReviewStep
  } = useCheckout();

  return (
    <div>
      <div data-testid="current-step">{checkoutState.step}</div>
      <div data-testid="shipping-address">
        {checkoutState.shippingAddress ? checkoutState.shippingAddress.fullName : 'None'}
      </div>
      <div data-testid="payment-method">
        {checkoutState.paymentMethod || 'None'}
      </div>
      <div data-testid="order-notes">{checkoutState.orderNotes}</div>
      <div data-testid="addresses-loading">{addressesLoading.toString()}</div>
      <div data-testid="addresses-error">{addressesError}</div>
      <div data-testid="addresses-count">{addresses.length}</div>
      <div data-testid="can-proceed-review">{canProceedToReview.toString()}</div>
      <div data-testid="is-payment-step">{isPaymentStep.toString()}</div>
      <div data-testid="is-review-step">{isReviewStep.toString()}</div>
      
      <button onClick={() => setShippingAddress({ _id: '1', fullName: 'Test User' })}>
        Set Address
      </button>
      <button onClick={() => setShippingMethod({ id: 'standard', cost: 5 })}>Set Shipping</button>
      <button onClick={() => setPaymentMethod('credit-card')}>Set Payment</button>
      <button onClick={() => setOrderNotes('Test notes')}>Set Notes</button>
      <button onClick={() => goToStep('payment')}>Go to Payment</button>
      <button onClick={() => goToStep('review')}>Go to Review</button>
      <button onClick={nextStep}>Next Step</button>
      <button onClick={prevStep}>Prev Step</button>
      <button onClick={resetCheckout}>Reset</button>
      <button onClick={refreshAddresses}>Refresh Addresses</button>
    </div>
  );
};

const renderWithProviders = (authenticated = true) => {
  // Mock useAuth for this test
  useAuth.mockReturnValue({
    isAuthenticated: authenticated,
    isLoading: false,
    user: authenticated ? { _id: '1', email: 'test@example.com' } : null
  });

  return render(
    <CheckoutProvider>
      <TestComponent />
    </CheckoutProvider>
  );
};

describe('CheckoutContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // clearAllMocks wipes the factory mockReturnValue; restore it.
    useCart.mockReturnValue(cartReturnValue);
    getUserAddresses.mockResolvedValue({
      data: {
        addresses: [
          {
            _id: '1',
            fullName: 'John Doe',
            addressLine1: '123 Main St',
            city: 'Anytown',
            stateProvince: 'CA',
            postalCode: '12345',
            country: 'USA',
            isDefault: true
          },
          {
            _id: '2',
            fullName: 'Jane Doe',
            addressLine1: '456 Oak Ave',
            city: 'Somewhere',
            stateProvince: 'NY',
            postalCode: '67890',
            country: 'USA',
            isDefault: false
          }
        ]
      }
    });
  });

  describe('Initial State', () => {
    it('should provide initial checkout state', () => {
      renderWithProviders();

      expect(screen.getByTestId('current-step')).toHaveTextContent('payment');
      expect(screen.getByTestId('shipping-address')).toHaveTextContent('None');
      expect(screen.getByTestId('payment-method')).toHaveTextContent('None');
      expect(screen.getByTestId('order-notes')).toHaveTextContent('');
      expect(screen.getByTestId('can-proceed-review')).toHaveTextContent('false');
      expect(screen.getByTestId('is-payment-step')).toHaveTextContent('true');
      expect(screen.getByTestId('is-review-step')).toHaveTextContent('false');
    });

    it('should load addresses for authenticated users', async () => {
      renderWithProviders(true);

      await waitFor(() => {
        expect(screen.getByTestId('addresses-count')).toHaveTextContent('2');
      });

      // The provider reloads addresses when the auto-selected default address
      // changes loadAddresses' identity, so the effect fires more than once.
      expect(getUserAddresses).toHaveBeenCalled();
      expect(getUserAddresses.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('should auto-select default address', async () => {
      renderWithProviders(true);
      
      await waitFor(() => {
        expect(screen.getByTestId('shipping-address')).toHaveTextContent('John Doe');
      });
    });

    it('should not load addresses for unauthenticated users', () => {
      renderWithProviders(false);
      
      expect(getUserAddresses).not.toHaveBeenCalled();
      expect(screen.getByTestId('addresses-count')).toHaveTextContent('0');
    });
  });

  describe('Address Management', () => {
    it('should handle address loading errors', async () => {
      getUserAddresses.mockRejectedValue(new Error('Failed to load addresses'));
      renderWithProviders(true);
      
      await waitFor(() => {
        expect(screen.getByTestId('addresses-error')).toHaveTextContent('Failed to load addresses');
      });
    });

    it('should refresh addresses when requested', async () => {
      renderWithProviders(true);

      const initialCount = await waitFor(() => {
        const count = getUserAddresses.mock.calls.length;
        expect(count).toBeGreaterThanOrEqual(1);
        return count;
      });

      const refreshButton = screen.getByText('Refresh Addresses');
      await act(async () => {
        await userEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(getUserAddresses.mock.calls.length).toBeGreaterThan(initialCount);
      });
    });
  });

  describe('State Updates', () => {
    it('should update shipping address', async () => {
      renderWithProviders();

      const setAddressButton = screen.getByText('Set Address');
      await act(async () => {
        await userEvent.click(setAddressButton);
      });

      expect(screen.getByTestId('shipping-address')).toHaveTextContent('Test User');
    });

    it('should update payment method', async () => {
      renderWithProviders();

      const setPaymentButton = screen.getByText('Set Payment');
      await act(async () => {
        await userEvent.click(setPaymentButton);
      });

      expect(screen.getByTestId('payment-method')).toHaveTextContent('credit-card');
    });

    it('should update order notes', async () => {
      renderWithProviders();

      const setNotesButton = screen.getByText('Set Notes');
      await act(async () => {
        await userEvent.click(setNotesButton);
      });

      expect(screen.getByTestId('order-notes')).toHaveTextContent('Test notes');
    });

    it('should enable review step when address, shipping method and payment are set', async () => {
      renderWithProviders();

      const setAddressButton = screen.getByText('Set Address');
      const setShippingButton = screen.getByText('Set Shipping');
      const setPaymentButton = screen.getByText('Set Payment');

      await act(async () => {
        await userEvent.click(setAddressButton);
        await userEvent.click(setShippingButton);
        await userEvent.click(setPaymentButton);
      });

      expect(screen.getByTestId('can-proceed-review')).toHaveTextContent('true');
    });
  });

  describe('Step Navigation', () => {
    it('should navigate to specific step', async () => {
      renderWithProviders();

      const goToReviewButton = screen.getByText('Go to Review');
      await act(async () => {
        await userEvent.click(goToReviewButton);
      });

      expect(screen.getByTestId('current-step')).toHaveTextContent('review');
      expect(screen.getByTestId('is-review-step')).toHaveTextContent('true');
    });

    it('should navigate to next step', async () => {
      renderWithProviders();

      const nextButton = screen.getByText('Next Step');
      await act(async () => {
        await userEvent.click(nextButton);
      });

      expect(screen.getByTestId('current-step')).toHaveTextContent('review');
    });

    it('should navigate to previous step', async () => {
      renderWithProviders();

      // Go to review first
      const nextButton = screen.getByText('Next Step');
      await act(async () => {
        await userEvent.click(nextButton);
      });

      // Then go back
      const prevButton = screen.getByText('Prev Step');
      await act(async () => {
        await userEvent.click(prevButton);
      });

      expect(screen.getByTestId('current-step')).toHaveTextContent('payment');
    });

    it('should not go beyond last step', async () => {
      renderWithProviders();

      const nextButton = screen.getByText('Next Step');
      await act(async () => {
        await userEvent.click(nextButton); // payment -> review
        await userEvent.click(nextButton); // try to go beyond
      });

      expect(screen.getByTestId('current-step')).toHaveTextContent('review');
    });

    it('should not go before first step', async () => {
      renderWithProviders();

      const prevButton = screen.getByText('Prev Step');
      await act(async () => {
        await userEvent.click(prevButton);
      });

      expect(screen.getByTestId('current-step')).toHaveTextContent('payment');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset checkout state', async () => {
      // Render unauthenticated so addresses are not auto-selected on reload,
      // letting reset produce a clean (empty) shipping address.
      renderWithProviders(false);

      // Set some state
      const setAddressButton = screen.getByText('Set Address');
      const setPaymentButton = screen.getByText('Set Payment');
      const nextButton = screen.getByText('Next Step');

      await act(async () => {
        await userEvent.click(setAddressButton);
        await userEvent.click(setPaymentButton);
        await userEvent.click(nextButton); // -> review
      });

      // Reset
      const resetButton = screen.getByText('Reset');
      await act(async () => {
        await userEvent.click(resetButton);
      });

      expect(screen.getByTestId('current-step')).toHaveTextContent('payment');
      expect(screen.getByTestId('shipping-address')).toHaveTextContent('None');
      expect(screen.getByTestId('payment-method')).toHaveTextContent('None');
      expect(screen.getByTestId('can-proceed-review')).toHaveTextContent('false');
    });
  });

  describe('Context Error Handling', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();
      
      expect(() => {
        renderBare(<TestComponent />);
      }).toThrow('useCheckout must be used within a CheckoutProvider');
      
      console.error = originalError;
    });
  });
});