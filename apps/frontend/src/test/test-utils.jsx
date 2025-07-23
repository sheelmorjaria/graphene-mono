import React from 'react'
import { render as rtlRender, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { vi } from 'vitest'
import { AuthProvider, AuthStateContext, AuthDispatchContext } from '../contexts/AuthContext'
import { CartProvider, CartContext } from '../contexts/CartContext'

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
  resetPassword: vi.fn()
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
  clearCart: vi.fn()
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
              {children}
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