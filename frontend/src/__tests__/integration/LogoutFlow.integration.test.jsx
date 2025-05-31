import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../contexts/AuthContext';
import { AppRoutes } from '../../App';

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

// Mock auth service
vi.mock('../../services/authService', () => ({
  getCurrentUser: vi.fn(),
  logoutUser: vi.fn(),
  loginUser: vi.fn()
}));

import { getCurrentUser, logoutUser, loginUser } from '../../services/authService';

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

// Mock fetch globally
global.fetch = vi.fn();

const renderLogoutTest = (initialRoute = '/products') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Logout Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Test';
    localStorage.clear();
    mockNavigate.mockClear();
    
    // Mock successful products fetch
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockProductsResponse
    });
  });

  it('should show logout option when user is authenticated', async () => {
    // Mock authenticated user
    getCurrentUser.mockResolvedValue(mockUser);

    renderLogoutTest('/products');

    // Wait for authentication check and products to load
    await waitFor(() => {
      expect(screen.getByText('Welcome, John')).toBeInTheDocument();
    });

    // User menu should be visible
    expect(screen.getByText('Welcome, John')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();
  });

  it('should successfully logout user when clicking sign out', async () => {
    const user = userEvent.setup();
    
    // Mock authenticated user
    getCurrentUser.mockResolvedValue(mockUser);
    logoutUser.mockResolvedValue();

    renderLogoutTest('/products');

    // Wait for authentication and products to load
    await waitFor(() => {
      expect(screen.getByText('Welcome, John')).toBeInTheDocument();
    });

    // Click on user dropdown to open menu
    await user.click(screen.getByText('Welcome, John'));

    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    // Click sign out
    await user.click(screen.getByRole('button', { name: /sign out/i }));

    // Verify logout service was called
    await waitFor(() => {
      expect(logoutUser).toHaveBeenCalled();
    });

    // Should show login/register links again
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    });

    // User menu should no longer be visible
    expect(screen.queryByText('Welcome, John')).not.toBeInTheDocument();
  });

  it('should handle logout service error gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock authenticated user
    getCurrentUser.mockResolvedValue(mockUser);
    // Mock logout service error
    logoutUser.mockRejectedValue(new Error('Network error'));

    renderLogoutTest('/products');

    // Wait for authentication and products to load
    await waitFor(() => {
      expect(screen.getByText('Welcome, John')).toBeInTheDocument();
    });

    // Click on user dropdown
    await user.click(screen.getByText('Welcome, John'));

    // Click sign out
    await user.click(screen.getByRole('button', { name: /sign out/i }));

    // Even with logout error, user should be logged out locally
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    });

    expect(screen.queryByText('Welcome, John')).not.toBeInTheDocument();
  });

  it('should show login/register links when not authenticated', async () => {
    // Mock no authenticated user
    getCurrentUser.mockResolvedValue(null);

    renderLogoutTest('/products');

    // Wait for authentication check and products to load
    await waitFor(() => {
      expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    });

    // Should show login/register links
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();

    // Should not show user menu
    expect(screen.queryByText('Welcome, John')).not.toBeInTheDocument();
  });

  it('should close dropdown after successful logout', async () => {
    const user = userEvent.setup();
    
    // Mock authenticated user
    getCurrentUser.mockResolvedValue(mockUser);
    logoutUser.mockResolvedValue();

    renderLogoutTest('/products');

    // Wait for authentication and products to load
    await waitFor(() => {
      expect(screen.getByText('Welcome, John')).toBeInTheDocument();
    });

    // Click on user dropdown to open menu
    await user.click(screen.getByText('Welcome, John'));

    // Verify dropdown content is visible
    await waitFor(() => {
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    // Click sign out
    await user.click(screen.getByRole('button', { name: /sign out/i }));

    // After logout, dropdown should be closed and user menu gone
    await waitFor(() => {
      expect(screen.queryByText('john.doe@example.com')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /profile/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Welcome, John')).not.toBeInTheDocument();
    });
  });
});