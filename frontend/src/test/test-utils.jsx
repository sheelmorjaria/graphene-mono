import React from 'react'
import { render as rtlRender, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, beforeAll, afterAll } from 'vitest'
import { AuthProvider } from '../contexts/AuthContext'
import { CartProvider } from '../contexts/CartContext'

// Mock auth service to prevent real API calls
vi.mock('../services/authService', () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  logoutUser: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn()
}))

// Mock cart service to prevent real API calls
vi.mock('../services/cartService', () => ({
  getCart: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  addToCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn()
}))

// Suppress act warnings in tests by default
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to') &&
      args[0].includes('inside a test was not wrapped in act')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

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
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    )
  }

  // Use async act to handle async state updates
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