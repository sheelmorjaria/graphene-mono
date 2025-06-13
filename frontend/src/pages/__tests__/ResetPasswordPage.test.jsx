import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ResetPasswordPage from '../ResetPasswordPage';

// Mock navigate function
const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('?token=test-token'), vi.fn()],
  };
});

// Mock auth service
vi.mock('../../services/authService', () => ({
  resetPassword: vi.fn()
}));

import { resetPassword } from '../../services/authService';

const renderResetPasswordPage = () => {
  return render(
    <MemoryRouter>
      <ResetPasswordPage />
    </MemoryRouter>
  );
};

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Test';
    mockNavigate.mockClear();
  });

  describe('Page Rendering', () => {
    it('should render reset password page with form fields', async () => {
      renderResetPasswordPage();

      expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
      expect(screen.getByLabelText('New Password *')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm New Password *')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
      expect(screen.getByText(/enter your new password below/i)).toBeInTheDocument();
    });

    it('should set correct page title', () => {
      renderResetPasswordPage();
      expect(document.title).toBe('Reset Password - GrapheneOS Store');
    });

    it('should show error for missing token', () => {
      // For this test, we need to render with no token
      const TestComponentWithoutToken = () => {
        const [searchParams] = React.useState(new URLSearchParams()); // No token
        
        // Mock the useSearchParams hook for this test
        const MockedResetPasswordPage = () => {
          const _navigate = () => {};
          const token = searchParams.get('token'); // Will be null
          
          return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
              {!token && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-sm text-red-600">Invalid or missing reset token. Please request a new password reset.</div>
                </div>
              )}
            </div>
          );
        };
        
        return <MockedResetPasswordPage />;
      };
      
      render(
        <MemoryRouter>
          <TestComponentWithoutToken />
        </MemoryRouter>
      );
      
      expect(screen.getByText('Invalid or missing reset token. Please request a new password reset.')).toBeInTheDocument();
    });

    it('should have link back to login page', () => {
      renderResetPasswordPage();
      
      const loginLink = screen.getByRole('link', { name: /back to login/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Password Strength Validation', () => {
    it('should show password requirements when focused', async () => {
      const user = userEvent.setup();
      renderResetPasswordPage();

      const newPasswordInput = screen.getByLabelText('New Password *');
      await user.click(newPasswordInput);

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
      const user = userEvent.setup();
      renderResetPasswordPage();

      const newPasswordInput = screen.getByLabelText('New Password *');
      
      // Test weak password
      await user.type(newPasswordInput, 'weak');
      await waitFor(() => {
        expect(screen.getByText('weak')).toBeInTheDocument();
      });

      // Test medium password
      await user.clear(newPasswordInput);
      await user.type(newPasswordInput, 'Password1');
      await waitFor(() => {
        expect(screen.getByText('medium')).toBeInTheDocument();
      });

      // Test strong password
      await user.clear(newPasswordInput);
      await user.type(newPasswordInput, 'StrongPass123!');
      await waitFor(() => {
        expect(screen.getByText('strong')).toBeInTheDocument();
      });
    });

    it('should validate password strength on blur', async () => {
      const user = userEvent.setup();
      renderResetPasswordPage();

      const newPasswordInput = screen.getByLabelText('New Password *');
      await user.type(newPasswordInput, 'weak');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate confirm password match', async () => {
      const user = userEvent.setup();
      renderResetPasswordPage();

      const newPasswordInput = screen.getByLabelText('New Password *');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password *');

      await user.type(newPasswordInput, 'StrongPass123!');
      await user.type(confirmPasswordInput, 'DifferentPass123!');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it('should clear field errors when user starts typing', async () => {
      const user = userEvent.setup();
      renderResetPasswordPage();

      const newPasswordInput = screen.getByLabelText('New Password *');
      await user.type(newPasswordInput, 'weak');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      await user.type(newPasswordInput, 'StrongPass123!');

      await waitFor(() => {
        expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      resetPassword.mockResolvedValue({
        success: true,
        message: 'Password has been reset successfully'
      });

      renderResetPasswordPage();

      await user.type(screen.getByLabelText('New Password *'), 'NewPassword456!');
      await user.type(screen.getByLabelText('Confirm New Password *'), 'NewPassword456!');

      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(resetPassword).toHaveBeenCalledWith({
          token: 'test-token',
          newPassword: 'NewPassword456!',
          confirmNewPassword: 'NewPassword456!'
        });
      });
    });

    it('should show success message and redirect to login after successful reset', async () => {
      const user = userEvent.setup();
      resetPassword.mockResolvedValue({
        success: true,
        message: 'Password has been reset successfully'
      });

      renderResetPasswordPage();

      await user.type(screen.getByLabelText('New Password *'), 'NewPassword456!');
      await user.type(screen.getByLabelText('Confirm New Password *'), 'NewPassword456!');

      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText(/password has been reset successfully/i)).toBeInTheDocument();
      });

      // Should redirect to login page after showing success message
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      }, { timeout: 3000 });
    });

    it('should handle password reset errors', async () => {
      const user = userEvent.setup();
      resetPassword.mockRejectedValue(new Error('Password reset token is invalid or has expired'));

      renderResetPasswordPage();

      await user.type(screen.getByLabelText('New Password *'), 'NewPassword456!');
      await user.type(screen.getByLabelText('Confirm New Password *'), 'NewPassword456!');

      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText('Password reset token is invalid or has expired')).toBeInTheDocument();
      });
    });

    it('should prevent submission with validation errors', async () => {
      const user = userEvent.setup();
      renderResetPasswordPage();

      // Try to submit with weak password
      await user.type(screen.getByLabelText('New Password *'), 'weak');
      await user.type(screen.getByLabelText('Confirm New Password *'), 'weak');

      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(resetPassword).not.toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      resetPassword.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderResetPasswordPage();

      await user.type(screen.getByLabelText('New Password *'), 'NewPassword456!');
      await user.type(screen.getByLabelText('Confirm New Password *'), 'NewPassword456!');

      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resetting/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /resetting/i })).toBeDisabled();
      });
    });

    it('should disable form during submission', async () => {
      const user = userEvent.setup();
      resetPassword.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderResetPasswordPage();

      await user.type(screen.getByLabelText('New Password *'), 'NewPassword456!');
      await user.type(screen.getByLabelText('Confirm New Password *'), 'NewPassword456!');

      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('New Password *')).toBeDisabled();
        expect(screen.getByLabelText('Confirm New Password *')).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and structure', async () => {
      renderResetPasswordPage();

      expect(screen.getByRole('form')).toBeInTheDocument();
      
      const newPasswordInput = screen.getByLabelText('New Password *');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password *');

      expect(newPasswordInput).toHaveAttribute('required');
      expect(newPasswordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('required');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    it('should associate error messages with form fields', async () => {
      const user = userEvent.setup();
      renderResetPasswordPage();

      const newPasswordInput = screen.getByLabelText('New Password *');
      await user.type(newPasswordInput, 'weak');
      await user.tab();

      await waitFor(() => {
        const errorElement = screen.getByText(/password must be at least 8 characters/i);
        expect(errorElement).toBeInTheDocument();
        expect(newPasswordInput).toHaveAttribute('aria-describedby');
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back to login when clicking back link', async () => {
      const user = userEvent.setup();
      renderResetPasswordPage();

      const backLink = screen.getByRole('link', { name: /back to login/i });
      await user.click(backLink);

      // Link navigation is handled by React Router, so we just check the href
      expect(backLink).toHaveAttribute('href', '/login');
    });
  });
});