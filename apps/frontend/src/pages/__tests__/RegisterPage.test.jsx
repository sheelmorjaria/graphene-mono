import { render, screen, waitFor, act, userEvent } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RegisterPage from '../RegisterPage';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock auth service
vi.mock('../../services/authService', () => ({
  registerUser: vi.fn()
}));

import { registerUser } from '../../services/authService';

const renderRegisterPage = (initialRoute = '/register') => {
  return render(<RegisterPage />, {
    initialEntries: [initialRoute]
  });
};

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Page Rendering', () => {
    it('should render registration form with all required fields', () => {
      renderRegisterPage();

      expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Password *')).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should render optional fields', () => {
      renderRegisterPage();

      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/receive marketing emails/i)).toBeInTheDocument();
    });

    it('should render login link', () => {
      renderRegisterPage();

      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    });

    it('should set correct page title', () => {
      renderRegisterPage();
      expect(document.title).toBe('Create Account - GrapheneOS Store');
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      renderRegisterPage();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      
      await act(async () => {
        await userEvent.click(submitButton);
      });

      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.tab(); // Trigger blur

      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });

    it('should validate password strength', async () => {
      renderRegisterPage();

      const passwordInput = screen.getByLabelText('Password *');
      await userEvent.type(passwordInput, 'weak');
      await userEvent.tab(); // Trigger blur

      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    it('should validate password confirmation match', async () => {
      renderRegisterPage();

      const passwordInput = screen.getByLabelText('Password *');
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(passwordInput, 'StrongPass123!');
      await userEvent.type(confirmPasswordInput, 'DifferentPass123!');
      await userEvent.tab(); // Trigger blur

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('should validate phone number format when provided', async () => {
      renderRegisterPage();

      const phoneInput = screen.getByLabelText(/phone number/i);
      await userEvent.type(phoneInput, 'invalid-phone');
      await userEvent.tab(); // Trigger blur

      expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument();
    });

    it('should show password strength requirements', async () => {
      renderRegisterPage();

      const passwordInput = screen.getByLabelText('Password *');
      await userEvent.click(passwordInput);

      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/lowercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/number/i)).toBeInTheDocument();
      expect(screen.getByText(/special character/i)).toBeInTheDocument();
    });

    it('should update password strength indicator', async () => {
      renderRegisterPage();

      const passwordInput = screen.getByLabelText('Password *');
      
      // Type weak password
      await userEvent.type(passwordInput, 'weak');
      expect(screen.getByText(/weak/i)).toBeInTheDocument();

      // Clear and type strong password
      await userEvent.clear(passwordInput);
      await userEvent.type(passwordInput, 'StrongPass123!');
      expect(screen.getByText(/strong/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      email: 'john.doe@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe'
    };

    it('should submit form with valid data', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: {
            id: '123',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      };

      registerUser.mockResolvedValue(mockResponse);
      renderRegisterPage();

      // Fill in the form
      await userEvent.type(screen.getByLabelText(/email address/i), validFormData.email);
      await userEvent.type(screen.getByLabelText(/^password$/i), validFormData.password);
      await userEvent.type(screen.getByLabelText(/confirm password/i), validFormData.confirmPassword);
      await userEvent.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await userEvent.type(screen.getByLabelText(/last name/i), validFormData.lastName);

      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(registerUser).toHaveBeenCalledWith({
          email: validFormData.email,
          password: validFormData.password,
          confirmPassword: validFormData.confirmPassword,
          firstName: validFormData.firstName,
          lastName: validFormData.lastName,
          phone: '',
          marketingOptIn: false
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith('/products');
    });

    it('should submit form with optional fields', async () => {
      const mockResponse = {
        success: true,
        data: { token: 'mock-token', user: {} }
      };

      registerUser.mockResolvedValue(mockResponse);
      renderRegisterPage();

      // Fill in all fields including optional ones
      await userEvent.type(screen.getByLabelText(/email address/i), validFormData.email);
      await userEvent.type(screen.getByLabelText(/^password$/i), validFormData.password);
      await userEvent.type(screen.getByLabelText(/confirm password/i), validFormData.confirmPassword);
      await userEvent.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await userEvent.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await userEvent.type(screen.getByLabelText(/phone number/i), '+447123456789');
      await userEvent.click(screen.getByLabelText(/receive marketing emails/i));

      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(registerUser).toHaveBeenCalledWith({
          email: validFormData.email,
          password: validFormData.password,
          confirmPassword: validFormData.confirmPassword,
          firstName: validFormData.firstName,
          lastName: validFormData.lastName,
          phone: '+447123456789',
          marketingOptIn: true
        });
      });
    });

    it('should handle registration errors', async () => {
      const errorMessage = 'An account with this email already exists';
      
      registerUser.mockRejectedValue(new Error(errorMessage));
      renderRegisterPage();

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/email address/i), validFormData.email);
      await userEvent.type(screen.getByLabelText(/^password$/i), validFormData.password);
      await userEvent.type(screen.getByLabelText(/confirm password/i), validFormData.confirmPassword);
      await userEvent.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await userEvent.type(screen.getByLabelText(/last name/i), validFormData.lastName);

      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      let resolveRegister;
      const registerPromise = new Promise(resolve => {
        resolveRegister = resolve;
      });

      registerUser.mockReturnValue(registerPromise);
      renderRegisterPage();

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/email address/i), validFormData.email);
      await userEvent.type(screen.getByLabelText(/^password$/i), validFormData.password);
      await userEvent.type(screen.getByLabelText(/confirm password/i), validFormData.confirmPassword);
      await userEvent.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await userEvent.type(screen.getByLabelText(/last name/i), validFormData.lastName);

      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      // Should show loading state
      expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();

      // Resolve the promise
      resolveRegister({ success: true, data: { token: 'token', user: {} } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
      });
    });

    it('should disable form during submission', async () => {
      let resolveRegister;
      const registerPromise = new Promise(resolve => {
        resolveRegister = resolve;
      });

      registerUser.mockReturnValue(registerPromise);
      renderRegisterPage();

      await userEvent.type(screen.getByLabelText(/email address/i), validFormData.email);
      await userEvent.type(screen.getByLabelText(/^password$/i), validFormData.password);
      await userEvent.type(screen.getByLabelText(/confirm password/i), validFormData.confirmPassword);
      await userEvent.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await userEvent.type(screen.getByLabelText(/last name/i), validFormData.lastName);

      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      // All form fields should be disabled
      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
      expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
      expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
      expect(screen.getByLabelText(/first name/i)).toBeDisabled();
      expect(screen.getByLabelText(/last name/i)).toBeDisabled();

      resolveRegister({ success: true, data: { token: 'token', user: {} } });
    });
  });

  describe('Navigation', () => {
    it('should navigate to login page when clicking sign in link', async () => {
      renderRegisterPage();

      const signInLink = screen.getByRole('link', { name: 'Sign in' });
      expect(signInLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and structure', () => {
      renderRegisterPage();

      expect(screen.getByRole('form')).toBeInTheDocument();
      
      // Check that all inputs have proper labels
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Password *')).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/receive marketing emails/i)).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      renderRegisterPage();

      const heading = screen.getByRole('heading', { name: /create your account/i });
      expect(heading.tagName).toBe('H1');
    });

    it('should associate error messages with form fields', async () => {
      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.tab();

      const errorMessage = screen.getByText(/please enter a valid email address/i);
      expect(errorMessage).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('aria-describedby');
    });
  });
});