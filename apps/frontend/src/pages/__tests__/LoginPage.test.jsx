import { render, screen, waitFor, userEvent } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LoginPage from '../LoginPage';

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
  loginUser: vi.fn()
}));

// Mock auth context
const mockLogin = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useLogin: () => mockLogin
}));

import { loginUser } from '../../services/authService';

const renderLoginPage = (initialRoute = '/login') => {
  return render(<LoginPage />, {
    initialEntries: [initialRoute]
  });
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockClear();
    document.title = 'Test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Page Rendering', () => {
    it('should render login form with required fields', () => {
      renderLoginPage();

      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render registration link', () => {
      renderLoginPage();

      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      renderLoginPage();

      expect(screen.getByRole('link', { name: /forgot your password/i })).toBeInTheDocument();
    });

    it('should set correct page title', () => {
      renderLoginPage();
      expect(document.title).toBe('Sign In - GrapheneOS Store');
    });
  });

  describe('Form Validation', () => {
    it('should prevent submission with empty required fields', async () => {
      renderLoginPage();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Should stay on login page (validation prevented submission)
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.tab(); // Trigger blur

      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });

    it('should clear validation errors when user starts typing', async () => {
      renderLoginPage();

      // Trigger validation error
      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.tab();

      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();

      // Start typing again - error should clear
      await userEvent.type(emailInput, '@example.com');
      expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    const validCredentials = {
      email: 'john.doe@example.com',
      password: 'SecurePass123!'
    };

    it('should submit form with valid credentials', async () => {
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

      loginUser.mockResolvedValue(mockResponse);
      renderLoginPage();

      // Fill in the form
      await userEvent.type(screen.getByLabelText(/email address/i), validCredentials.email);
      await userEvent.type(screen.getByLabelText(/password/i), validCredentials.password);

      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(loginUser).toHaveBeenCalledWith({
          email: validCredentials.email,
          password: validCredentials.password
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith('/products');
    });

    it('should handle login errors', async () => {
      const errorMessage = 'Invalid email or password';
      
      loginUser.mockRejectedValue(new Error(errorMessage));
      renderLoginPage();

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/email address/i), validCredentials.email);
      await userEvent.type(screen.getByLabelText(/password/i), validCredentials.password);

      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle disabled account error', async () => {
      const errorMessage = 'Account has been disabled. Please contact support for assistance.';
      
      loginUser.mockRejectedValue(new Error(errorMessage));
      renderLoginPage();

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/email address/i), validCredentials.email);
      await userEvent.type(screen.getByLabelText(/password/i), validCredentials.password);

      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      let resolveLogin;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });

      loginUser.mockReturnValue(loginPromise);
      renderLoginPage();

      // Fill and submit form
      await userEvent.type(screen.getByLabelText(/email address/i), validCredentials.email);
      await userEvent.type(screen.getByLabelText(/password/i), validCredentials.password);

      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show loading state
      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

      // Resolve the promise
      resolveLogin({ success: true, data: { token: 'token', user: {} } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      });
    });

    it('should disable form during submission', async () => {
      let resolveLogin;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });

      loginUser.mockReturnValue(loginPromise);
      renderLoginPage();

      await userEvent.type(screen.getByLabelText(/email address/i), validCredentials.email);
      await userEvent.type(screen.getByLabelText(/password/i), validCredentials.password);

      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // All form fields should be disabled
      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();

      resolveLogin({ success: true, data: { token: 'token', user: {} } });
    });

    it('should handle case-insensitive email login', async () => {
      const mockResponse = {
        success: true,
        data: { token: 'token', user: {} }
      };

      loginUser.mockResolvedValue(mockResponse);
      renderLoginPage();

      await userEvent.type(screen.getByLabelText(/email address/i), 'JOHN.DOE@EXAMPLE.COM');
      await userEvent.type(screen.getByLabelText(/password/i), validCredentials.password);

      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(loginUser).toHaveBeenCalledWith({
          email: 'JOHN.DOE@EXAMPLE.COM',
          password: validCredentials.password
        });
      });
    });

    it('should clear general error when user starts typing', async () => {
      
      loginUser.mockRejectedValue(new Error('Invalid credentials'));
      renderLoginPage();

      // Submit form to trigger error
      await userEvent.type(screen.getByLabelText(/email address/i), validCredentials.email);
      await userEvent.type(screen.getByLabelText(/password/i), 'wrong-password');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Start typing - error should clear
      await userEvent.type(screen.getByLabelText(/password/i), '!');
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to registration page when clicking create account link', () => {
      renderLoginPage();

      const createAccountLink = screen.getByRole('link', { name: /create account/i });
      expect(createAccountLink).toHaveAttribute('href', '/register');
    });

    it('should have forgot password link with correct href', () => {
      renderLoginPage();

      const forgotPasswordLink = screen.getByRole('link', { name: /forgot your password/i });
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and structure', () => {
      renderLoginPage();

      expect(screen.getByRole('form')).toBeInTheDocument();
      
      // Check that all inputs have proper labels
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      renderLoginPage();

      const heading = screen.getByRole('heading', { name: /sign in to your account/i });
      expect(heading.tagName).toBe('H1');
    });

    it('should associate error messages with form fields', async () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.tab();

      const errorMessage = screen.getByText(/please enter a valid email address/i);
      expect(errorMessage).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('aria-describedby');
    });

    it('should have proper button states', async () => {
      renderLoginPage();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).not.toBeDisabled();

      // Mock loading state
      let resolveLogin;
      const loginPromise = new Promise(resolve => { resolveLogin = resolve; });
      loginUser.mockReturnValue(loginPromise);

      await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password');
      await userEvent.click(submitButton);

      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

      resolveLogin({ success: true, data: { token: 'token', user: {} } });
    });
  });

  describe('Remember Me Functionality', () => {
    it('should render remember me checkbox', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should handle remember me checkbox state', async () => {
      renderLoginPage();

      const checkbox = screen.getByLabelText(/remember me/i);
      expect(checkbox).not.toBeChecked();

      await userEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      await userEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });
});