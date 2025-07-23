import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from '../ForgotPasswordPage';

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
  forgotPassword: vi.fn()
}));

import { forgotPassword } from '../../services/authService';

const renderForgotPasswordPage = () => {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>
  );
};

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Test';
    mockNavigate.mockClear();
  });

  describe('Page Rendering', () => {
    it('should render forgot password page with form fields', async () => {
      renderForgotPasswordPage();

      expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
      expect(screen.getByText(/enter your email address and we'll send you a link to reset your password/i)).toBeInTheDocument();
    });

    it('should set correct page title', () => {
      renderForgotPasswordPage();
      expect(document.title).toBe('Forgot Password - GrapheneOS Store');
    });

    it('should have link back to login page', () => {
      renderForgotPasswordPage();
      
      const loginLink = screen.getByRole('link', { name: /back to login/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Form Validation', () => {
    it('should validate required email field', async () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      
      // Focus and blur to trigger validation
      await userEvent.click(emailInput);
      await userEvent.tab();

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.tab();

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('should clear error when user starts typing', async () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      
      // Trigger validation error first
      await userEvent.type(emailInput, 'invalid');
      await userEvent.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      // Start typing to clear error
      await userEvent.type(emailInput, '@example.com');
      
      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid email', async () => {
      forgotPassword.mockResolvedValue({
        success: true,
        message: 'If an account exists for that email, a password reset link has been sent.'
      });

      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(forgotPassword).toHaveBeenCalledWith({ email: 'test@example.com' });
      });
    });

    it('should show success message after submission', async () => {
      forgotPassword.mockResolvedValue({
        success: true,
        message: 'If an account exists for that email, a password reset link has been sent.'
      });

      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('If an account exists for that email, a password reset link has been sent.')).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      forgotPassword.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
      });
    });

    it('should disable form during submission', async () => {
      forgotPassword.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toBeDisabled();
      });
    });

    it('should handle API errors gracefully', async () => {
      forgotPassword.mockRejectedValue(new Error('Server error'));

      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('should clear form after successful submission', async () => {
      forgotPassword.mockResolvedValue({
        success: true,
        message: 'If an account exists for that email, a password reset link has been sent.'
      });

      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toHaveValue('');
      });
    });

    it('should prevent multiple submissions', async () => {
      forgotPassword.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      // Click multiple times
      await userEvent.click(submitButton);
      await userEvent.click(submitButton);
      await userEvent.click(submitButton);

      // Should only be called once
      expect(forgotPassword).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and structure', () => {
      renderForgotPasswordPage();

      expect(screen.getByRole('form')).toBeInTheDocument();
      
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should associate error messages with form fields', async () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.tab();

      await waitFor(() => {
        const errorElement = screen.getByText('Please enter a valid email address');
        expect(errorElement).toBeInTheDocument();
        expect(emailInput).toHaveAttribute('aria-describedby');
      });
    });

    it('should have proper focus management', async () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      
      // Focus should be on email input initially
      await userEvent.tab();
      expect(emailInput).toHaveFocus();
    });
  });

  describe('Navigation', () => {
    it('should navigate back to login when clicking back link', async () => {
      renderForgotPasswordPage();

      const backLink = screen.getByRole('link', { name: /back to login/i });
      await userEvent.click(backLink);

      // Link navigation is handled by React Router, so we just check the href
      expect(backLink).toHaveAttribute('href', '/login');
    });
  });
});