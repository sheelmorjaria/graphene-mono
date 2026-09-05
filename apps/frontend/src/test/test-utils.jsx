import React from 'react'
import { render as rtlRender, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { vi } from 'vitest'
import { AuthStateContext, AuthDispatchContext } from '../contexts/AuthContext'
import { CartContext } from '../contexts/CartContext'
import { CheckoutContext } from '../contexts/CheckoutContext'

// IMPORTANT: import the REAL context objects from the app's context modules.
// Components under test call useAuthState()/useCart()/useCheckout(), which read
// from these exact context objects. Previously these were locally-created
// contexts, so the test providers were invisible to the components, causing
// "must be used within an AuthProvider/CartProvider" errors.

// Mock auth service to prevent real API calls
vi.mock('../services/authService', () => ({
  getCurrentUser: vi.fn().mockImplementation(() => {
    // Return a promise that resolves immediately to avoid act warnings
    return Promise.resolve(null)
  }),
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  logoutUser: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  updateUserProfile: vi.fn(),
  changePassword: vi.fn(),
  forgotPassword: vi.fn(),
  getAuthToken: vi.fn()
}))

// Mock cart service to prevent real API calls
vi.mock('../services/cartService', () => ({
  getCart: vi.fn().mockImplementation(() => {
    // Return a promise that resolves immediately to avoid act warnings
    return Promise.resolve({ items: [], total: 0 })
  }),
  addToCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn(),
  mergeGuestCart: vi.fn(() => Promise.resolve({ success: true }))
}))

// React act warnings are now properly handled in test files

// Test-specific AuthProvider that doesn't make async calls
const TestAuthProvider = ({ children }) => {
  const [state, setState] = React.useState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  })

  const dispatch = React.useCallback((action) => {
    switch (action.type) {
      case 'AUTH_SUCCESS':
        setState({
          user: action.payload,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        break;
      case 'AUTH_FAILURE':
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: action.payload
        });
        break;
      case 'LOGOUT':
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        break;
      default:
        break;
    }
  }, []);

  return (
    <AuthStateContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  )
}

// Test-specific CartProvider that doesn't make async calls
const TestCartProvider = ({ children }) => {
  const [cart] = React.useState({
    items: [],
    totalItems: 0,
    totalAmount: 0,
    itemCount: 0
  })

  const addToCart = vi.fn().mockResolvedValue({
    success: true,
    message: 'Product added to cart',
    addedItem: { productId: 'test', quantity: 1 }
  })

  const contextValue = {
    cart,
    loading: false,
    error: '',
    addToCart,
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
    refreshCart: vi.fn(),
    clearError: vi.fn(),
    isEmpty: cart.items.length === 0,
    itemCount: cart.totalItems || 0
  }

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}

// Test-specific CheckoutProvider that doesn't make async calls
const TestCheckoutProvider = ({ children }) => {
  const [checkoutState] = React.useState({
    step: 'payment',
    deliveryAddress: null,
    shippingAddress: null,
    billingAddress: null,
    useSameAsShipping: true,
    shippingMethod: null,
    shippingCost: 0,
    paymentMethod: null,
    orderNotes: ''
  })

  const [paymentState] = React.useState({
    isProcessing: false,
    error: null,
    paymentData: null
  })

  const [addresses] = React.useState([])
  const [addressesLoading] = React.useState(false)
  const [addressesError] = React.useState('')
  const [shippingRates] = React.useState([])
  const [shippingRatesLoading] = React.useState(false)
  const [shippingRatesError] = React.useState('')

  const contextValue = {
    // State
    checkoutState,
    paymentState,
    addresses,
    addressesLoading,
    addressesError,
    shippingRates,
    shippingRatesLoading,
    shippingRatesError,

    // Actions
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

    // Computed values
    canProceedToReview: false,
    isPaymentStep: true,
    isReviewStep: false,

    // Order totals and summary
    subtotal: 0,
    shippingCost: 0,
    orderTotal: 0,
    orderSummary: {
      cartTotal: 0,
      shippingCost: 0,
      orderTotal: 0,
      currency: 'GBP',
      items: [],
      shippingMethod: null,
      shippingAddress: null,
      billingAddress: null,
      deliveryAddress: null
    },

    // Convenience accessors
    deliveryAddress: null,
    shippingAddress: null,
    billingAddress: null,
    useSameAsShipping: true,
    shippingMethod: null,
    paymentMethod: null,
    orderNotes: ''
  }

  return (
    <CheckoutContext.Provider value={contextValue}>
      {children}
    </CheckoutContext.Provider>
  )
}

// Custom render function that includes necessary providers
function render(
  ui,
  {
    initialEntries = ['/'],
    initialIndex = 0,
    ...renderOptions
  } = {}
) {
  // Create a wrapper component with all necessary providers
  function Wrapper({ children }) {
    return (
      <HelmetProvider>
        <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
          <TestAuthProvider>
            <TestCartProvider>
              <TestCheckoutProvider>
                {children}
              </TestCheckoutProvider>
            </TestCartProvider>
          </TestAuthProvider>
        </MemoryRouter>
      </HelmetProvider>
    )
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

// Helper to wait for async operations
export async function waitForLoadingToFinish() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

// Re-export everything
export * from '@testing-library/react'
export { render }
export { default as userEvent } from '@testing-library/user-event'