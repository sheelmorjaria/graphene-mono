import React from 'react';
import { render, screen, waitFor, act } from '../../test/test-utils';
import { fireEvent } from '@testing-library/react';
// Raw RTL render, with NO provider wrapper, for the "used outside provider" test.
import { render as renderBare } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';

import { vi } from 'vitest';

// Mock cartService (CartProvider imports these directly)
vi.mock('../../services/cartService', () => ({
  getCart: vi.fn(),
  addToCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn()
}));

// Mock AuthContext - CartProvider uses useAuth() for isAuthenticated
vi.mock('../AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: false })),
  useLogin: vi.fn(),
  useAuthState: vi.fn(() => ({ user: null, isAuthenticated: false, isLoading: false })),
  useAuthDispatch: vi.fn(() => vi.fn()),
  AuthProvider: ({ children }) => children,
  AuthStateContext: React.createContext(),
  AuthDispatchContext: React.createContext()
}));

import {
  getCart,
  addToCart as addToCartService,
  updateCartItem as updateCartItemService,
  removeFromCart as removeFromCartService,
  clearCart as clearCartService
} from '../../services/cartService';
import { useAuth } from '../AuthContext';

// Consumer component that exposes the cart context value for assertions
const CartConsumer = ({ actionRef }) => {
  const ctx = useCart();
  if (actionRef) actionRef.current = ctx;
  return (
    <div>
      <span data-testid="total-items">{ctx.itemCount}</span>
      <span data-testid="is-empty">{String(ctx.isEmpty)}</span>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <span data-testid="error">{ctx.error}</span>
      <button onClick={() => ctx.addToCart('p1', 2)}>add</button>
      <button onClick={() => ctx.updateCartItem('p1', 3)}>update</button>
      <button onClick={() => ctx.removeFromCart('p1')}>remove</button>
      <button onClick={() => ctx.clearCart()}>clear</button>
      <button onClick={() => ctx.refreshCart()}>refresh</button>
      <button onClick={() => ctx.clearError()}>clear-error</button>
    </div>
  );
};

const renderCartProvider = ({ auth = { isAuthenticated: false } } = {}) => {
  useAuth.mockReturnValue(auth);
  const actionRef = { current: null };
  const utils = render(
    <CartProvider>
      <CartConsumer actionRef={actionRef} />
    </CartProvider>
  );
  return { ...utils, actionRef };
};

describe('CartContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default cart payload returned by getCart on mount
    getCart.mockResolvedValue({
      data: { cart: { items: [], totalItems: 0, totalAmount: 0, itemCount: 0 } }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when useCart is called outside a CartProvider', () => {
    // Suppress the expected error from React/test runner
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderBare(<CartConsumer />)).toThrow('useCart must be used within a CartProvider');
    spy.mockRestore();
  });

  it('loads the cart on mount', async () => {
    getCart.mockResolvedValueOnce({
      data: { cart: { items: [{ id: 'p1' }], totalItems: 2, totalAmount: 10, itemCount: 2 } }
    });

    renderCartProvider();

    await waitFor(() => {
      expect(screen.getByTestId('total-items').textContent).toBe('2');
    });
    expect(getCart).toHaveBeenCalledTimes(1);
  });

  it('sets an error message when getCart fails on mount', async () => {
    getCart.mockRejectedValueOnce(new Error('Network down'));

    renderCartProvider();

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Network down');
    });
  });

  it('addToCart delegates to the service and reloads the cart', async () => {
    addToCartService.mockResolvedValueOnce({
      message: 'added',
      data: { cart: { totalItems: 1, totalAmount: 5, itemCount: 1 }, addedItem: { id: 'p1' } }
    });
    getCart.mockResolvedValueOnce({
      data: { cart: { items: [{ id: 'p1' }], totalItems: 1, totalAmount: 5, itemCount: 1 } }
    });

    const { } = renderCartProvider();
    await waitFor(() => expect(getCart).toHaveBeenCalled());

    await act(async () => {
      fireEvent.click(screen.getByText('add'));
    });

    await waitFor(() => expect(addToCartService).toHaveBeenCalledWith('p1', 2, null));
    expect(getCart).toHaveBeenCalledTimes(2); // initial load + reload
  });

  it('updateCartItem delegates to the service', async () => {
    updateCartItemService.mockResolvedValueOnce({ message: 'updated' });

    renderCartProvider();
    await waitFor(() => expect(getCart).toHaveBeenCalled());

    await act(async () => {
      fireEvent.click(screen.getByText('update'));
    });

    await waitFor(() => expect(updateCartItemService).toHaveBeenCalledWith('p1', 3));
  });

  it('removeFromCart delegates to the service', async () => {
    removeFromCartService.mockResolvedValueOnce({ message: 'removed' });

    renderCartProvider();
    await waitFor(() => expect(getCart).toHaveBeenCalled());

    await act(async () => {
      fireEvent.click(screen.getByText('remove'));
    });

    await waitFor(() => expect(removeFromCartService).toHaveBeenCalledWith('p1', undefined));
  });

  it('clearCart delegates to the service', async () => {
    clearCartService.mockResolvedValueOnce({ message: 'cleared' });

    renderCartProvider();
    await waitFor(() => expect(getCart).toHaveBeenCalled());

    await act(async () => {
      fireEvent.click(screen.getByText('clear'));
    });

    await waitFor(() => expect(clearCartService).toHaveBeenCalled());
  });

  it('refreshCart triggers another getCart call', async () => {
    renderCartProvider();
    await waitFor(() => expect(getCart).toHaveBeenCalledTimes(1));

    await act(async () => {
      fireEvent.click(screen.getByText('refresh'));
    });

    await waitFor(() => expect(getCart).toHaveBeenCalledTimes(2));
  });

  it('clearError resets the error state', async () => {
    getCart.mockRejectedValueOnce(new Error('boom'));
    const { actionRef } = renderCartProvider();

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('boom');
    });

    act(() => {
      actionRef.current.clearError();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('');
    });
  });

  it('exposes computed isEmpty and itemCount based on cart state', async () => {
    getCart.mockResolvedValueOnce({
      data: { cart: { items: [{ id: 'p1' }], totalItems: 4, totalAmount: 20, itemCount: 4 } }
    });

    renderCartProvider();

    await waitFor(() => {
      expect(screen.getByTestId('total-items').textContent).toBe('4');
      expect(screen.getByTestId('is-empty').textContent).toBe('false');
    });
  });
});
