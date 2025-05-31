import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../App';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock fetch globally for integration tests
global.fetch = vi.fn();

// Mock auth service
vi.mock('../../services/authService', () => ({
  getCurrentUser: vi.fn(),
  logoutUser: vi.fn(),
  loginUser: vi.fn(),
  registerUser: vi.fn()
}));

import { getCurrentUser, logoutUser, loginUser } from '../../services/authService';

const mockLoginResponse = {
  success: true,
  data: {
    token: 'mock-jwt-token',
    user: {
      id: '123',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'customer'
    }
  }
};

const mockProfileResponse = {
  success: true,
  data: {
    user: {
      id: '123',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'customer'
    }
  }
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

const renderIntegrationTest = (initialRoute = '/login') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Login Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Test';
    localStorage.clear();
    // Mock getCurrentUser to return null initially (not authenticated)
    getCurrentUser.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should complete full login flow and redirect to products', async () => {
    const user = userEvent.setup();

    // Mock successful login
    loginUser.mockResolvedValueOnce(mockLoginResponse);

    // Mock products page load
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductsResponse
    });

    renderIntegrationTest('/login');

    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    });

    // Fill out the login form
    await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify login service was called with correct data
    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith({
        email: 'john.doe@example.com',
        password: 'SecurePass123!'
      });
    });

    // Should redirect to products page
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Verify token was stored (this would be done by the loginUser service)
    // We can verify the user is logged in by checking for the welcome message
    await waitFor(() => {
      expect(screen.getByText('Welcome, John')).toBeInTheDocument();
    });
  });

  it('should handle login errors', async () => {
    const user = userEvent.setup();

    // Mock login error
    loginUser.mockRejectedValueOnce(new Error('Invalid email or password'));

    renderIntegrationTest('/login');

    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    });

    // Fill out the form
    await user.type(screen.getByLabelText(/email address/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });

    // Should stay on login page
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();

    // Should not show authenticated user menu
    expect(screen.queryByText('Welcome, John')).not.toBeInTheDocument();
  });

  it('should navigate to login page from header', async () => {
    const user = userEvent.setup();

    // Mock products page load
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductsResponse
    });

    renderIntegrationTest('/products');

    // Wait for products page to load
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Click Login link in header
    const loginLink = screen.getByRole('link', { name: /login/i });
    await user.click(loginLink);

    // Should navigate to login page
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    });
  });

  it('should validate form before submission', async () => {
    const user = userEvent.setup();

    renderIntegrationTest('/login');

    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for validation to complete
    await waitFor(() => {
      // API should not be called
      expect(fetch).not.toHaveBeenCalled();
    });

    // Form should still be on login page (validation prevented submission)
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
  });

  it('should handle remember me functionality', async () => {
    const user = userEvent.setup();

    // Mock successful login
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLoginResponse
    });

    // Mock products page load
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductsResponse
    });

    renderIntegrationTest('/login');

    // Fill out the form
    await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');
    
    // Check remember me
    await user.click(screen.getByLabelText(/remember me/i));

    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify login was successful
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });
  });

  it('should show authenticated user menu after login', async () => {
    const user = userEvent.setup();

    // Mock auth check (no user initially)
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    // Mock successful login
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLoginResponse
    });

    // Mock products page load
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductsResponse
    });

    renderIntegrationTest('/login');

    // Wait for login page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    });

    // Fill out and submit login form
    await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Should redirect to products and show user menu
    await waitFor(() => {
      expect(screen.getByText('Welcome, John')).toBeInTheDocument();
    });

    // Login/Register links should not be visible
    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();
  });

  it('should logout user when clicking sign out', async () => {
    const user = userEvent.setup();

    // Mock authenticated user check
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfileResponse
    });

    // Mock products page load
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductsResponse
    });

    // Set up authenticated state
    localStorage.setItem('authToken', 'mock-jwt-token');

    renderIntegrationTest('/products');

    // Wait for products page to load with authenticated user
    await waitFor(() => {
      expect(screen.getByText('Welcome, John')).toBeInTheDocument();
    });

    // Click on user dropdown to open menu
    await user.click(screen.getByText('Welcome, John'));

    // Click sign out
    await user.click(screen.getByRole('button', { name: /sign out/i }));

    // Should show login/register links again
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    });

    // User menu should no longer be visible
    expect(screen.queryByText('Welcome, John')).not.toBeInTheDocument();

    // Token should be removed
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();

    renderIntegrationTest('/login');

    // Enter invalid email
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur event

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('should update document title on login page', () => {
    renderIntegrationTest('/login');

    expect(document.title).toBe('Sign In - GrapheneOS Store');
  });

  it('should provide links to registration page', () => {
    renderIntegrationTest('/login');

    const registerLinks = screen.getAllByRole('link', { name: /create account|create a new account/i });
    expect(registerLinks.length).toBeGreaterThan(0);
    
    registerLinks.forEach(link => {
      expect(link).toHaveAttribute('href', '/register');
    });
  });

  it('should provide forgot password link', () => {
    renderIntegrationTest('/login');

    const forgotPasswordLink = screen.getByRole('link', { name: /forgot your password/i });
    expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
  });

  it('should handle server error responses', async () => {
    const user = userEvent.setup();

    // Mock server error
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error occurred' })
    });

    renderIntegrationTest('/login');

    // Fill out the form
    await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Server error occurred')).toBeInTheDocument();
    });

    // Should stay on login page
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
  });

  it('should clear field errors when user starts typing', async () => {
    const user = userEvent.setup();

    renderIntegrationTest('/login');

    // Enter invalid email to trigger error
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid');
    await user.tab();

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    // Start typing again
    await user.type(emailInput, '@example.com');

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });
  });
});