import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from '../ForgotPasswordPage';
import ResetPasswordPage from '../ResetPasswordPage';

// Mock navigate function
const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('?token=test-reset-token'), vi.fn()],
  };
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

const renderForgotPasswordPage = () => {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>
  );
};

const renderResetPasswordPage = () => {
  return render(
    <MemoryRouter>
      <ResetPasswordPage />
    </MemoryRouter>
  );
};

describe('Password Reset Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockFetch.mockClear();
  });

  it('should complete the full password reset flow', async () => {
    const user = userEvent.setup();
    
    // Step 1: Request password reset
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/auth/forgot-password')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            message: 'If an account exists for that email, a password reset link has been sent.'
          })
        });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    renderForgotPasswordPage();

    // Fill out forgot password form
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitButton);

    // Verify API call was made
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/forgot-password',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' })
        })
      );
    });

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('If an account exists for that email, a password reset link has been sent.')).toBeInTheDocument();
    });

    // Verify form was cleared
    expect(emailInput).toHaveValue('');
  });

  it('should complete the password reset with valid token', async () => {
    const user = userEvent.setup();
    
    // Mock successful password reset
    mockFetch.mockImplementation((url, options) => {
      if (url.includes('/api/auth/reset-password')) {
        const requestBody = JSON.parse(options.body);
        
        // Validate request body
        expect(requestBody).toMatchObject({
          token: 'test-reset-token',
          newPassword: 'NewSecurePass456@',
          confirmNewPassword: 'NewSecurePass456@'
        });
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            message: 'Password has been reset successfully'
          })
        });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    renderResetPasswordPage();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    });

    // Fill out the reset password form
    await user.type(screen.getByLabelText('New Password *'), 'NewSecurePass456@');
    await user.type(screen.getByLabelText('Confirm New Password *'), 'NewSecurePass456@');

    // Verify password strength shows as strong
    await waitFor(() => {
      expect(screen.getByText('strong')).toBeInTheDocument();
    });

    // Submit the form
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    // Verify success message appears
    await waitFor(() => {
      expect(screen.getByText(/password has been reset successfully/i)).toBeInTheDocument();
    });

    // Verify redirect to login page occurs
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    }, { timeout: 3000 });
  });

  it('should handle forgot password API errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/auth/forgot-password')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            success: false,
            error: 'Server error occurred'
          })
        });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    renderForgotPasswordPage();

    // Fill out the form
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    await user.click(submitButton);

    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByText('Server error occurred')).toBeInTheDocument();
    });

    // Verify no redirect occurred
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should handle reset password API errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/auth/reset-password')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            success: false,
            error: 'Password reset token is invalid or has expired'
          })
        });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    renderResetPasswordPage();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    });

    // Fill out the form with valid passwords
    await user.type(screen.getByLabelText('New Password *'), 'NewSecurePass456@');
    await user.type(screen.getByLabelText('Confirm New Password *'), 'NewSecurePass456@');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByText('Password reset token is invalid or has expired')).toBeInTheDocument();
    });

    // Verify no redirect occurred
    expect(mockNavigate).not.toHaveBeenCalledWith('/login');
  });

  it('should validate password strength in reset flow', async () => {
    const user = userEvent.setup();
    
    renderResetPasswordPage();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    });

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

    // Test password requirements display
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
});