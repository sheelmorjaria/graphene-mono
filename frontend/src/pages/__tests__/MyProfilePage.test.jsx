import React from 'react';
import { render, screen, waitFor, userEvent } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyProfilePage from '../MyProfilePage';

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
  getAuthToken: vi.fn()
}));

import { getCurrentUser, updateUserProfile } from '../../services/authService';

const mockUser = {
  id: '123',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+447123456789',
  role: 'customer'
};

const renderProfilePage = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <MyProfilePage />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('MyProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Test';
    mockNavigate.mockClear();
    getCurrentUser.mockResolvedValue(mockUser);
  });

  describe('Page Rendering', () => {
    it('should render profile page with form fields', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('should pre-fill form with current user data', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('+447123456789')).toBeInTheDocument();
      });
    });

    it('should set correct page title', () => {
      renderProfilePage();
      expect(document.title).toBe('My Profile - GrapheneOS Store');
    });

    it('should show loading state initially', () => {
      getCurrentUser.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderProfilePage();

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show email field as disabled', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeDisabled();
      expect(screen.getByText('Contact support to change your email address')).toBeInTheDocument();
    });

    it('should validate phone number format', async () => {
      const user = userEvent.setup();
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('+447123456789')).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.clear(phoneInput);
      await user.type(phoneInput, 'invalid-phone');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
      });
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });
    });

    it('should clear field errors when user starts typing', async () => {
      const user = userEvent.setup();
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });

      await user.type(firstNameInput, 'Jane');

      await waitFor(() => {
        expect(screen.queryByText('First name is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      updateUserProfile.mockResolvedValue({
        success: true,
        data: { user: { ...mockUser, firstName: 'Jane' } }
      });

      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(updateUserProfile).toHaveBeenCalledWith({
          firstName: 'Jane',
          lastName: 'Doe',
          phone: '+447123456789',
          marketingOptIn: false
        });
      });
    });

    it('should show success message after successful update', async () => {
      const user = userEvent.setup();
      updateUserProfile.mockResolvedValue({
        success: true,
        data: { user: { ...mockUser, firstName: 'Jane' } }
      });

      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle update errors', async () => {
      const user = userEvent.setup();
      updateUserProfile.mockRejectedValue(new Error('Email already exists'));

      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });

    it('should prevent submission with validation errors', async () => {
      const user = userEvent.setup();
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(updateUserProfile).not.toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      updateUserProfile.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument();
      });
    });

    it('should disable form during submission', async () => {
      const user = userEvent.setup();
      updateUserProfile.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeDisabled();
        expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and structure', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      expect(screen.getByRole('form')).toBeInTheDocument();
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const phoneInput = screen.getByLabelText(/phone number/i);

      expect(firstNameInput).toHaveAttribute('required');
      expect(lastNameInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('required');
      expect(phoneInput).not.toHaveAttribute('required');
    });

    it('should associate error messages with form fields', async () => {
      const user = userEvent.setup();
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);
      await user.tab();

      await waitFor(() => {
        const errorElement = screen.getByText('First name is required');
        expect(errorElement).toBeInTheDocument();
        expect(firstNameInput).toHaveAttribute('aria-describedby');
      });
    });
  });
});