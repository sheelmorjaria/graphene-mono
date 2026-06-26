import React from 'react';
import { render, screen, waitFor, act, userEvent } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppRoutes } from '../../App';
import { AuthStateContext, AuthDispatchContext } from '../../contexts/AuthContext';

// Mock navigate function
const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// authService is mocked by the shared test-utils (getCurrentUser/loginUser/
// logoutUser). It omits updateUserProfile, which is installed onto the shared
// mock module instance below (see authServiceModule.updateUserProfile).

// Mock products service (ProductListPage fetches via productsService, not fetch)
vi.mock('../../services/productsService', () => ({
  default: {
    getProducts: vi.fn()
  }
}));

import { getCurrentUser } from '../../services/authService';
import * as authServiceModule from '../../services/authService';
import productsService from '../../services/productsService';

// The shared test-utils mock of authService omits updateUserProfile. The mock
// object is a live shared module instance, so installing the mock method onto
// it here makes it available to both this test and the component under test.
const updateUserProfile = vi.fn();
authServiceModule.updateUserProfile = updateUserProfile;

const mockUser = {
  id: '123',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+447123456789',
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

describe('Profile Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Test';
    localStorage.clear();
    mockNavigate.mockClear();
    getCurrentUser.mockResolvedValue(mockUser);
    updateUserProfile.mockResolvedValue({
      success: true,
      data: { user: mockUser }
    });
    productsService.getProducts.mockResolvedValue(mockProductsResponse);
  });

  it('should navigate to profile page from user menu', async () => {
    renderAuthenticatedTest('/products', mockUser);

    // Wait for authentication and products to load (header shows first name)
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Click on user dropdown to open menu
    await act(async () => {
      await userEvent.click(screen.getByText('John'));
    });

    // Wait for dropdown to appear and click Profile
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^profile$/i })).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByRole('link', { name: /^profile$/i }));
    });

    // Should navigate to profile page
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument();
    });

    // Should show user data pre-filled
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+447123456789')).toBeInTheDocument();
  });

  it('should successfully update profile information', async () => {
    updateUserProfile.mockResolvedValue({
      success: true,
      data: { user: { ...mockUser, firstName: 'Jane', phone: '+441234567890' } }
    });

    renderAuthenticatedTest('/profile', mockUser);

    // Wait for profile page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument();
    });

    // Wait for form to be pre-filled
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    // Update first name
    const firstNameInput = screen.getByLabelText(/first name/i);
    await act(async () => {
      await userEvent.clear(firstNameInput);
      await userEvent.type(firstNameInput, 'Jane');
    });

    // Update phone number
    const phoneInput = screen.getByLabelText(/phone number/i);
    await act(async () => {
      await userEvent.clear(phoneInput);
      await userEvent.type(phoneInput, '+441234567890');
    });

    // Submit the form
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    // Verify API was called with correct data
    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+441234567890'
      });
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
  });

  it('should handle profile update errors', async () => {
    updateUserProfile.mockRejectedValue(new Error('Phone number is invalid'));

    renderAuthenticatedTest('/profile', mockUser);

    // Wait for profile page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument();
    });

    // Wait for form to be pre-filled
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    // Submit the form without changes to trigger an error
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Phone number is invalid')).toBeInTheDocument();
    });
  });

  it('should validate form fields before submission', async () => {
    renderAuthenticatedTest('/profile', mockUser);

    // Wait for profile page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument();
    });

    // Wait for form to be pre-filled
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    // Clear required field
    const firstNameInput = screen.getByLabelText(/first name/i);
    await act(async () => {
      await userEvent.clear(firstNameInput);
    });

    // Trigger blur validation
    await act(async () => {
      await userEvent.tab();
    });

    // Try to submit
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    // Should not call update API
    expect(updateUserProfile).not.toHaveBeenCalled();

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });
  });

  it('should show email field as disabled with explanation', async () => {
    renderAuthenticatedTest('/profile', mockUser);

    // Wait for profile page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument();
    });

    // Wait for form to be pre-filled
    await waitFor(() => {
      expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
    });

    // Email field should be disabled
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toBeDisabled();

    // Should show explanation
    expect(screen.getByText('Contact support to change your email address')).toBeInTheDocument();
  });

  it('should validate phone number format', async () => {
    renderAuthenticatedTest('/profile', mockUser);

    // Wait for profile page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument();
    });

    // Wait for form to be pre-filled
    await waitFor(() => {
      expect(screen.getByDisplayValue('+447123456789')).toBeInTheDocument();
    });

    // Enter invalid phone number
    const phoneInput = screen.getByLabelText(/phone number/i);
    await act(async () => {
      await userEvent.clear(phoneInput);
      await userEvent.type(phoneInput, 'invalid-phone');
      await userEvent.tab(); // Trigger blur
    });

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });
  });

  it('should show loading state during form submission', async () => {
    updateUserProfile.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderAuthenticatedTest('/profile', mockUser);

    // Wait for profile page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument();
    });

    // Wait for form to be pre-filled
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    // Submit the form
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });

    // Form fields should be disabled
    expect(screen.getByLabelText(/first name/i)).toBeDisabled();
  });

  it('should redirect to login if not authenticated', async () => {
    // No authenticated user: render AppRoutes without seeding auth state.
    // The TestAuthProvider defaults to an unauthenticated session, so
    // MyProfilePage sees no user and navigates to /login.
    getCurrentUser.mockResolvedValue(null);

    render(<AppRoutes />, { initialEntries: ['/profile'] });

    // Should navigate to login page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
