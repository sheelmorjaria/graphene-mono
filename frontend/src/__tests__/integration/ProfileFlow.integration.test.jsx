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
  updateUserProfile: vi.fn(),
  logoutUser: vi.fn(),
  loginUser: vi.fn()
}));

import { getCurrentUser, updateUserProfile } from '../../services/authService';

const mockUser = {
  id: '123',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+447123456789',
  role: 'customer',
  marketingOptIn: false
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

const renderProfileIntegrationTest = (initialRoute = '/products') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Profile Flow Integration Tests', () => {
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

  it('should navigate to profile page from user menu', async () => {
    const user = userEvent.setup();
    
    // Mock authenticated user
    getCurrentUser.mockResolvedValue(mockUser);

    renderProfileIntegrationTest('/products');

    // Wait for authentication and products to load
    await waitFor(() => {
      expect(screen.getByText('Welcome, John')).toBeInTheDocument();
    });

    // Click on user dropdown to open menu
    await user.click(screen.getByText('Welcome, John'));

    // Wait for dropdown to appear and click Profile
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('link', { name: /profile/i }));

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
    const user = userEvent.setup();
    
    // Mock authenticated user
    getCurrentUser.mockResolvedValue(mockUser);
    updateUserProfile.mockResolvedValue({
      success: true,
      data: { user: { ...mockUser, firstName: 'Jane', phone: '+441234567890' } }
    });

    renderProfileIntegrationTest('/profile');

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
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Jane');

    // Update phone number
    const phoneInput = screen.getByLabelText(/phone number/i);
    await user.clear(phoneInput);
    await user.type(phoneInput, '+441234567890');

    // Enable marketing opt-in
    await user.click(screen.getByLabelText(/receive marketing emails/i));

    // Submit the form
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // Verify API was called with correct data
    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+441234567890',
        marketingOptIn: true
      });
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
  });

  it('should handle profile update errors', async () => {
    const user = userEvent.setup();
    
    // Mock authenticated user
    getCurrentUser.mockResolvedValue(mockUser);
    updateUserProfile.mockRejectedValue(new Error('Phone number is invalid'));

    renderProfileIntegrationTest('/profile');

    // Wait for profile page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument();
    });

    // Wait for form to be pre-filled
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    // Submit the form without changes to trigger an error
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Phone number is invalid')).toBeInTheDocument();
    });
  });

  it('should validate form fields before submission', async () => {
    const user = userEvent.setup();
    
    // Mock authenticated user
    getCurrentUser.mockResolvedValue(mockUser);

    renderProfileIntegrationTest('/profile');

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
    await user.clear(firstNameInput);

    // Try to submit
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // Should not call update API
    expect(updateUserProfile).not.toHaveBeenCalled();

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });
  });

  it('should show email field as disabled with explanation', async () => {
    // Mock authenticated user
    getCurrentUser.mockResolvedValue(mockUser);

    renderProfileIntegrationTest('/profile');

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
    const user = userEvent.setup();
    
    // Mock authenticated user
    getCurrentUser.mockResolvedValue(mockUser);

    renderProfileIntegrationTest('/profile');

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
    await user.clear(phoneInput);
    await user.type(phoneInput, 'invalid-phone');
    await user.tab(); // Trigger blur

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });
  });

  it('should show loading state during form submission', async () => {
    const user = userEvent.setup();
    
    // Mock authenticated user
    getCurrentUser.mockResolvedValue(mockUser);
    updateUserProfile.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderProfileIntegrationTest('/profile');

    // Wait for profile page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument();
    });

    // Wait for form to be pre-filled
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    // Submit the form
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });

    // Form fields should be disabled
    expect(screen.getByLabelText(/first name/i)).toBeDisabled();
  });

  it('should redirect to login if not authenticated', async () => {
    // Mock no authenticated user
    getCurrentUser.mockResolvedValue(null);

    renderProfileIntegrationTest('/profile');

    // Should navigate to login page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});