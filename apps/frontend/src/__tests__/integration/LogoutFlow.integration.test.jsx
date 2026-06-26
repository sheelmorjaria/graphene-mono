import React from 'react';
import { render, screen, waitFor, act, userEvent } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppRoutes } from '../../App';
import { AuthStateContext, AuthDispatchContext } from '../../contexts/AuthContext';

// Mock auth service
vi.mock('../../services/authService', () => ({
  getCurrentUser: vi.fn(),
  logoutUser: vi.fn(),
  loginUser: vi.fn()
}));

// Mock products service (ProductListPage fetches via productsService, not fetch)
vi.mock('../../services/productsService', () => ({
  default: {
    getProducts: vi.fn()
  }
}));

import { getCurrentUser, logoutUser } from '../../services/authService';
import productsService from '../../services/productsService';

const mockUser = {
  id: '123',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'customer'
};

const mockProductsResponse = {
  success: true,
  data: [
    {
      id: '1',
      name: 'GrapheneOS Pixel 9 Pro',
      slug: 'grapheneos-pixel-9-pro',
      shortDescription: 'Premium privacy smartphone',
      price: 899.99,
      images: ['https://example.com/pixel9pro.jpg'],
      condition: 'new',
      stockStatus: 'in_stock',
      category: { name: 'Smartphones' }
    }
  ],
  pagination: {
    page: 1,
    limit: 12,
    total: 1,
    pages: 1
  }
};

// Render with a pre-seeded authenticated user. The shared test-utils render
// wraps in a TestAuthProvider that ignores getCurrentUser, so to simulate a
// logged-in session we shadow the real AuthStateContext/AuthDispatchContext
// with seeded values nested inside the provider tree.
const renderAuthenticatedTest = (initialRoute = '/products', user) => {
  function AuthSeededWrapper({ children }) {
    const [state, setState] = React.useState({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });
    const dispatch = React.useCallback((action) => {
      if (action.type === 'AUTH_SUCCESS') {
        setState({ user: action.payload, isAuthenticated: true, isLoading: false, error: null });
      } else if (action.type === 'LOGOUT') {
        setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
      }
    }, []);
    return (
      <AuthStateContext.Provider value={state}>
        <AuthDispatchContext.Provider value={dispatch}>
          {children}
        </AuthDispatchContext.Provider>
      </AuthStateContext.Provider>
    );
  }

  return render(
    <AuthSeededWrapper>
      <AppRoutes />
    </AuthSeededWrapper>,
    { initialEntries: [initialRoute] }
  );
};

const renderLogoutTest = (initialRoute = '/products') => {
  return render(<AppRoutes />, {
    initialEntries: [initialRoute]
  });
};

describe('Logout Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Test';
    localStorage.clear();
    getCurrentUser.mockResolvedValue(null);
    logoutUser.mockResolvedValue({ success: true });
    productsService.getProducts.mockResolvedValue(mockProductsResponse);
  });

  it('should show logout option when user is authenticated', async () => {
    renderAuthenticatedTest('/products', mockUser);

    // User menu should be visible (header shows the user's first name)
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();
  });

  it('should successfully logout user when clicking sign out', async () => {
    logoutUser.mockResolvedValue({ success: true });

    renderAuthenticatedTest('/products', mockUser);

    // Wait for authentication and products to load
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Click on user dropdown to open menu
    await act(async () => {
      await userEvent.click(screen.getByText('John'));
    });

    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    // Click sign out
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /sign out/i }));
    });

    // Verify logout service was called
    await waitFor(() => {
      expect(logoutUser).toHaveBeenCalled();
    });

    // Should show login/register links again
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^login$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    });

    // User menu should no longer be visible
    expect(screen.queryByText('John')).not.toBeInTheDocument();
  });

  it('should handle logout service error gracefully', async () => {
    // Mock logout service error
    logoutUser.mockRejectedValue(new Error('Network error'));

    renderAuthenticatedTest('/products', mockUser);

    // Wait for authentication and products to load
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Click on user dropdown
    await act(async () => {
      await userEvent.click(screen.getByText('John'));
    });

    // Click sign out
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /sign out/i }));
    });

    // Even with logout error, user should be logged out locally
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^login$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    });

    expect(screen.queryByText('John')).not.toBeInTheDocument();
  });

  it('should show login/register links when not authenticated', async () => {
    // Mock no authenticated user
    getCurrentUser.mockResolvedValue(null);

    renderLogoutTest('/products');

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Should show login/register links
    expect(screen.getByRole('link', { name: /^login$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();

    // Should not show user menu
    expect(screen.queryByText('John')).not.toBeInTheDocument();
  });

  it('should close dropdown after successful logout', async () => {
    logoutUser.mockResolvedValue({ success: true });

    renderAuthenticatedTest('/products', mockUser);

    // Wait for authentication and products to load
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Click on user dropdown to open menu
    await act(async () => {
      await userEvent.click(screen.getByText('John'));
    });

    // Verify dropdown content is visible
    await waitFor(() => {
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    // Click sign out
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /sign out/i }));
    });

    // After logout, dropdown should be closed and user menu gone
    await waitFor(() => {
      expect(screen.queryByText('john.doe@example.com')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /profile/i })).not.toBeInTheDocument();
      expect(screen.queryByText('John')).not.toBeInTheDocument();
    });
  });
});
