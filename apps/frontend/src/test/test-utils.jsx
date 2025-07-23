import React from 'react'
import { render as rtlRender, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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
    total: 0,
    count: 0
  })

  return (
    <CartContext.Provider value={{ cart, dispatch: () => {} }}>
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
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        <TestAuthProvider>
          <TestCartProvider>
            {children}
          </TestCartProvider>
        </TestAuthProvider>
      </MemoryRouter>
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