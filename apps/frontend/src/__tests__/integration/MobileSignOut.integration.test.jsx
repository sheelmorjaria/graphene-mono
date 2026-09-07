import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../../App';

// The mobile menu's Sign Out button used to call useLogout() INSIDE its
// onClick — an invalid hook call that throws and is swallowed by the async
// handler, so tapping Sign Out on mobile did nothing. This test pins the fix:
// logout is hoisted to the Header render and the button click actually runs it.

vi.mock('../../services/authService', () => ({
  getCurrentUser: vi.fn(),
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  logoutUser: vi.fn().mockImplementation(() => {
    // Mirror the real implementation's essential side effect
    localStorage.removeItem('authToken');
    return Promise.resolve();
  }),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  getAuthToken: vi.fn()
}));

vi.mock('../../services/cartService', () => ({
  getCart: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalAmount: 0 }),
  addToCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn(),
  mergeGuestCart: vi.fn(),
  formatCurrency: vi.fn((amount) => `£${Number(amount).toFixed(2)}`)
}));

import { getCurrentUser, logoutUser } from '../../services/authService';

describe('Mobile menu sign-out', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // clearAllMocks strips factory-set implementations — re-arm
    logoutUser.mockImplementation(() => {
      localStorage.removeItem('authToken');
      return Promise.resolve();
    });
    localStorage.setItem('authToken', 'stale-token');
  });

  it('signs the user out when the mobile menu Sign Out button is tapped', async () => {
    getCurrentUser.mockResolvedValue({
      firstName: 'MobileUser',
      email: 'mobile@example.com'
    });

    render(<App />);

    // Header shows the logged-in user
    await waitFor(() => {
      expect(screen.getByText('MobileUser')).toBeInTheDocument();
    });
    expect(localStorage.getItem('authToken')).toBe('stale-token');

    // Open the mobile menu and tap Sign Out (last one = mobile menu instance)
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Toggle mobile menu' }));
    });

    const signOutButtons = screen.getAllByText('Sign Out');
    expect(signOutButtons.length).toBeGreaterThan(0);

    await act(async () => {
      await userEvent.click(signOutButtons[signOutButtons.length - 1]);
    });

    // Logout ran, token cleared, user gone from the header
    await waitFor(() => {
      expect(logoutUser).toHaveBeenCalled();
    });
    expect(localStorage.getItem('authToken')).toBeNull();
    await waitFor(() => {
      expect(screen.queryByText('MobileUser')).not.toBeInTheDocument();
    });
  });
});
