import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../App';

// Mock fetch globally for integration tests
global.fetch = vi.fn();

const mockRegisterResponse = {
  success: true,
  data: {
    token: 'mock-jwt-token',
    user: {
      id: '123',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'customer'
    },
    emailVerificationRequired: true
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

const renderIntegrationTest = (initialRoute = '/register') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppRoutes />
    </MemoryRouter>
  );
};

describe('Registration Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Test';
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should complete full registration flow and redirect to products', async () => {
    const user = userEvent.setup();

    // Mock successful registration
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRegisterResponse
    });

    // Mock products page load
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductsResponse
    });

    renderIntegrationTest('/register');

    // Verify we're on the registration page
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();

    // Fill out the registration form
    await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
    await user.type(screen.getByLabelText('Password *'), 'SecurePass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Verify API was called with correct data
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'john.doe@example.com',
            password: 'SecurePass123!',
            confirmPassword: 'SecurePass123!',
            firstName: 'John',
            lastName: 'Doe',
            phone: '',
            marketingOptIn: false
          })
        })
      );
    });

    // Should redirect to products page
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Verify token was stored
    expect(localStorage.getItem('authToken')).toBe('mock-jwt-token');
  });

  it('should handle registration errors', async () => {
    const user = userEvent.setup();

    // Mock registration error
    fetch.mockRejectedValueOnce(new Error('An account with this email already exists'));

    renderIntegrationTest('/register');

    // Fill out the form
    await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
    await user.type(screen.getByLabelText('Password *'), 'SecurePass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('An account with this email already exists')).toBeInTheDocument();
    });

    // Should stay on registration page
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();

    // Token should not be stored
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('should navigate to registration page from header', async () => {
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

    // Click Register link in header
    const registerLink = screen.getByRole('link', { name: /register/i });
    await user.click(registerLink);

    // Should navigate to registration page
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    });
  });

  it('should validate form before submission', async () => {
    const user = userEvent.setup();

    renderIntegrationTest('/register');

    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for validation to complete
    await waitFor(() => {
      // API should not be called
      expect(fetch).not.toHaveBeenCalled();
    });

    // Form should still be on registration page (validation prevented submission)
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
  });

  it('should handle registration with optional fields', async () => {
    const user = userEvent.setup();

    // Mock successful registration
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRegisterResponse
    });

    // Mock products page load
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProductsResponse
    });

    renderIntegrationTest('/register');

    // Fill out all fields including optional ones
    await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
    await user.type(screen.getByLabelText('Password *'), 'SecurePass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/phone number/i), '+447123456789');
    await user.click(screen.getByLabelText(/receive marketing emails/i));

    // Submit the form
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Verify API was called with all data
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/register',
        expect.objectContaining({
          body: JSON.stringify({
            email: 'john.doe@example.com',
            password: 'SecurePass123!',
            confirmPassword: 'SecurePass123!',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+447123456789',
            marketingOptIn: true
          })
        })
      );
    });
  });

  it('should update document title on registration page', () => {
    renderIntegrationTest('/register');

    expect(document.title).toBe('Create Account - GrapheneOS Store');
  });

  it('should provide links to login page', () => {
    renderIntegrationTest('/register');

    const loginLinks = screen.getAllByRole('link', { name: /sign in/i });
    expect(loginLinks.length).toBeGreaterThan(0);
    
    loginLinks.forEach(link => {
      expect(link).toHaveAttribute('href', '/login');
    });
  });
});