import React from 'react';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CartContext } from '../../contexts/CartContext';
import CartPage from '../CartPage';

// NOTE: We intentionally do NOT import the shared `render` from test-utils here.
// test-utils.jsx registers a `vi.mock` for cartService that omits the
// `formatCurrency` named export that CartPage imports, and that mock wins over a
// re-declaration in this file. Instead we mock cartService ourselves (with
// formatCurrency) and provide only the minimal providers CartPage needs.
vi.mock('../../services/cartService', () => ({
  formatCurrency: (amount) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount),
  getCart: vi.fn(() => Promise.resolve({ items: [], total: 0 })),
  addToCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn()
}));

// Helper to render CartPage with a fully-controlled cart context value.
function renderWithCart(cartValue) {
  function Wrapper({ children }) {
    return (
      <HelmetProvider>
        <MemoryRouter>
          <CartContext.Provider value={cartValue}>
            {children}
          </CartContext.Provider>
        </MemoryRouter>
      </HelmetProvider>
    );
  }
  return rtlRender(<CartPage />, { wrapper: Wrapper });
}

const baseCartValue = (overrides = {}) => ({
  cart: { items: [], totalItems: 0, totalAmount: 0 },
  loading: false,
  error: '',
  updateCartItem: vi.fn().mockResolvedValue({}),
  removeFromCart: vi.fn().mockResolvedValue({}),
  clearCart: vi.fn().mockResolvedValue({}),
  clearError: vi.fn(),
  refreshCart: vi.fn(),
  isEmpty: true,
  itemCount: 0,
  ...overrides
});

const sampleItem = (over = {}) => ({
  _id: 'item-1',
  productId: 'prod-1',
  productSlug: 'pixel-8',
  productName: 'Pixel 8 GrapheneOS',
  productImage: 'https://example.com/pixel.jpg',
  quantity: 2,
  unitPrice: 799.0,
  subtotal: 1598.0,
  variationId: 'var-1',
  leadTime: { displayText: '5-7 working days' },
  ...over
});

describe('CartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom does not implement window.confirm; default to accepting it so any
    // remove/clear flows that gate on confirm proceed unless a test overrides.
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders the empty-cart state and a continue-shopping link when there are no items', () => {
    renderWithCart(baseCartValue());

    expect(screen.getByText('Your Cart is Empty')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /continue shopping/i })
    ).toHaveAttribute('href', '/products');
  });

  it('renders the loading state when loading is true', () => {
    renderWithCart(baseCartValue({ loading: true }));

    expect(screen.getByText('Loading your cart...')).toBeInTheDocument();
  });

  it('renders an error banner and dismisses it via clearError', () => {
    const value = baseCartValue({ error: 'Something went wrong' });
    renderWithCart(value);

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    fireEvent.click(screen.getByText('×'));
    expect(value.clearError).toHaveBeenCalledTimes(1);
  });

  it('renders cart items, totals and a checkout button', () => {
    const item = sampleItem();
    const value = baseCartValue({
      cart: {
        items: [item],
        totalItems: 2,
        totalAmount: 1598.0,
        finalTotal: 1598.0
      },
      isEmpty: false,
      itemCount: 2
    });

    renderWithCart(value);

    // Header shows item count
    expect(screen.getByText(/Cart Items \(2 items\)/)).toBeInTheDocument();
    // Product name renders in both mobile and desktop views
    expect(screen.getAllByText('Pixel 8 GrapheneOS').length).toBe(2);
    // Subtotal uses formatCurrency (GBP)
    expect(screen.getAllByText('£1,598.00').length).toBeGreaterThan(0);
    // Checkout button present
    expect(
      screen.getByRole('button', { name: /proceed to checkout/i })
    ).toBeInTheDocument();
  });

  it('increases quantity via the + button and calls updateCartItem', async () => {
    const item = sampleItem({ quantity: 1 });
    const value = baseCartValue({
      cart: { items: [item], totalItems: 1, totalAmount: 799.0 }
    });

    renderWithCart(value);

    const increaseBtn = screen.getAllByLabelText('Increase quantity')[0];
    fireEvent.click(increaseBtn);

    await waitFor(() => {
      expect(value.updateCartItem).toHaveBeenCalledWith('prod-1', 2);
    });
  });

  it('does not decrease below 1 (decrease button disabled at quantity 1)', () => {
    const item = sampleItem({ quantity: 1 });
    const value = baseCartValue({
      cart: { items: [item], totalItems: 1, totalAmount: 799.0 }
    });

    renderWithCart(value);

    const decreaseBtn = screen.getAllByLabelText('Decrease quantity')[0];
    expect(decreaseBtn).toBeDisabled();
  });

  it('removes a desktop-row item via the remove button', async () => {
    const item = sampleItem({ quantity: 1 });
    const value = baseCartValue({
      cart: { items: [item], totalItems: 1, totalAmount: 799.0 }
    });

    renderWithCart(value);

    const removeBtns = screen.getAllByLabelText('Remove item');
    fireEvent.click(removeBtns[0]);

    await waitFor(() => {
      expect(value.removeFromCart).toHaveBeenCalledWith('prod-1', 'var-1');
    });
  });

  it('renders a Clear Cart button when more than one item is present and clears on click', async () => {
    const items = [
      sampleItem({ _id: 'a', quantity: 1, subtotal: 799.0 }),
      sampleItem({
        _id: 'b',
        productId: 'prod-2',
        productName: 'Pixel 8 Pro',
        quantity: 1,
        subtotal: 999.0
      })
    ];
    const value = baseCartValue({
      cart: { items, totalItems: 2, totalAmount: 1798.0 }
    });

    // window.confirm must return true for clearCart to proceed
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithCart(value);

    fireEvent.click(screen.getByText('Clear Cart'));

    await waitFor(() => {
      expect(value.clearCart).toHaveBeenCalledTimes(1);
    });
  });

  it('does not clear cart when the confirm dialog is cancelled', () => {
    const items = [
      sampleItem({ _id: 'a', quantity: 1 }),
      sampleItem({ _id: 'b', productId: 'p2', quantity: 1 })
    ];
    const value = baseCartValue({
      cart: { items, totalItems: 2, totalAmount: 1598.0 }
    });

    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderWithCart(value);

    fireEvent.click(screen.getByText('Clear Cart'));
    expect(value.clearCart).not.toHaveBeenCalled();
  });

  it('renders a "No Image" placeholder when an item has no productImage', () => {
    const item = sampleItem({ productImage: null });
    const value = baseCartValue({
      cart: { items: [item], totalItems: 1, totalAmount: 799.0 }
    });

    renderWithCart(value);

    expect(screen.getAllByText('No Image').length).toBeGreaterThan(0);
  });
});
