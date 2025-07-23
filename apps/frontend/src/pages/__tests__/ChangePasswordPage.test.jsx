import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ChangePasswordPage from '../ChangePasswordPage';
import { AuthProvider } from '../../contexts/AuthContext';

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
  changePassword: vi.fn(),
  getAuthToken: vi.fn()
}));

import { getCurrentUser, changePassword } from '../../services/authService';

const mockUser = {
  id: '123',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'customer'
};

const renderChangePasswordPage = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ChangePasswordPage />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Test';
    mockNavigate.mockClear();
    getCurrentUser.mockResolvedValue(mockUser);
  });

  describe('Page Rendering', () => {
    it('should render change password page with form fields', async () => {
      renderChangePasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText('New Password *')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm New Password *')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
    });

    it('should set correct page title', () => {
      renderChangePasswordPage();
      expect(document.title).toBe('Change Password - GrapheneOS Store');
    });

    it('should show loading state initially', () => {
      getCurrentUser.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderChangePasswordPage();

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should redirect to login if not authenticated', async () => {
      getCurrentUser.mockResolvedValue(null);

      renderChangePasswordPage();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Password Strength Validation', () => {
    it('should show password requirements when focused', async () => {
      renderChangePasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText('New Password *');
      await userEvent.click(newPasswordInput);

      await waitFor(() => {
        expect(screen.getByText(/password must contain/i)).toBeInTheDocument();
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument();
        expect(screen.getByText(/one lowercase letter/i)).toBeInTheDocument();
        expect(screen.getByText(/one number/i)).toBeInTheDocument();
        expect(screen.getByText(/one special character/i)).toBeInTheDocument();
      });
    });

    it('should show password strength indicator', async () => {
      renderChangePasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText('New Password *');
      
      // Test weak password
      await userEvent.type(newPasswordInput, 'weak');
      await waitFor(() => {
        expect(screen.getByText('weak')).toBeInTheDocument();
      });

      // Test medium password
      await userEvent.clear(newPasswordInput);
      await userEvent.type(newPasswordInput, 'Password1');
      await waitFor(() => {
        expect(screen.getByText('medium')).toBeInTheDocument();
      });

      // Test strong password
      await userEvent.clear(newPasswordInput);
      await userEvent.type(newPasswordInput, 'StrongPass123!');
      await waitFor(() => {
        expect(screen.getByText('strong')).toBeInTheDocument();
      });
    });

    it('should validate password strength on blur', async () => {
      renderChangePasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText('New Password *');
      await userEvent.type(newPasswordInput, 'weak');
      await userEvent.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate confirm password match', async () => {
      renderChangePasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText('New Password *');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password *');

      await userEvent.type(newPasswordInput, 'StrongPass123!');
      await userEvent.type(confirmPasswordInput, 'DifferentPass123!');
      await userEvent.tab();

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      changePassword.mockResolvedValue({
        success: true,
        message: 'Password changed successfully'
      });

      renderChangePasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText(/current password/i), 'OldPassword123!');
      await userEvent.type(screen.getByLabelText('New Password *'), 'NewPassword456!');
      await userEvent.type(screen.getByLabelText('Confirm New Password *'), 'NewPassword456!');

      await userEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => {
        expect(changePassword).toHaveBeenCalledWith({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
          confirmNewPassword: 'NewPassword456!'
        });
      });
    });

    it('should show success message and redirect to login after successful password change', async () => {
      changePassword.mockResolvedValue({
        success: true,
        message: 'Password changed successfully'
      });

      renderChangePasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText(/current password/i), 'OldPassword123!');
      await userEvent.type(screen.getByLabelText('New Password *'), 'NewPassword456!');
      await userEvent.type(screen.getByLabelText('Confirm New Password *'), 'NewPassword456!');

      await userEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument();
      });

      // Should redirect to login page after showing success message
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      }, { timeout: 3000 });
    });

    it('should handle password change errors', async () => {
      changePassword.mockRejectedValue(new Error('Current password is incorrect'));

      renderChangePasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText(/current password/i), 'WrongPassword');
      await userEvent.type(screen.getByLabelText('New Password *'), 'NewPassword456!');
      await userEvent.type(screen.getByLabelText('Confirm New Password *'), 'NewPassword456!');

      await userEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
      });
    });

    it('should prevent submission with validation errors', async () => {
      renderChangePasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      });

      // Try to submit with weak password
      await userEvent.type(screen.getByLabelText(/current password/i), 'OldPassword123!');
      await userEvent.type(screen.getByLabelText('New Password *'), 'weak');
      await userEvent.type(screen.getByLabelText('Confirm New Password *'), 'weak');

      await userEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => {
        expect(changePassword).not.toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      changePassword.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderChangePasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText(/current password/i), 'OldPassword123!');
      await userEvent.type(screen.getByLabelText('New Password *'), 'NewPassword456!');
      await userEvent.type(screen.getByLabelText('Confirm New Password *'), 'NewPassword456!');

      await userEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /updating/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
      });
    });

    it('should disable form during submission', async () => {
      changePassword.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderChangePasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText(/current password/i), 'OldPassword123!');
      await userEvent.type(screen.getByLabelText('New Password *'), 'NewPassword456!');
      await userEvent.type(screen.getByLabelText('Confirm New Password *'), 'NewPassword456!');

      await userEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toBeDisabled();
        expect(screen.getByLabelText('New Password *')).toBeDisabled();
        expect(screen.getByLabelText('Confirm New Password *')).toBeDisabled();
      });
    });

    it('should clear field errors when user starts typing', async () => {
      renderChangePasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText('New Password *');
      await userEvent.type(newPasswordInput, 'weak');
      await userEvent.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      await userEvent.type(newPasswordInput, 'StrongPass123!');

      await waitFor(() => {
        expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and structure', async () => {
      renderChangePasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('form')).toBeInTheDocument();
      
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText('New Password *');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password *');

      expect(currentPasswordInput).toHaveAttribute('required');
      expect(newPasswordInput).toHaveAttribute('required');
      expect(confirmPasswordInput).toHaveAttribute('required');
    });

    it('should associate error messages with form fields', async () => {
      renderChangePasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText('New Password *');
      await userEvent.type(newPasswordInput, 'weak');
      await userEvent.tab();

      await waitFor(() => {
        const errorElement = screen.getByText(/password must be at least 8 characters/i);
        expect(errorElement).toBeInTheDocument();
        expect(newPasswordInput).toHaveAttribute('aria-describedby');
      });
    });
  });
});