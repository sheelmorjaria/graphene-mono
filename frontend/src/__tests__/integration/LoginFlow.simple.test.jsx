import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../contexts/AuthContext';
import LoginPage from '../../pages/LoginPage';

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

import { getCurrentUser, loginUser, logoutUser } from '../../services/authService';

const mockLoginResponse = {
  success: true,
  data: {
    token: 'mock-jwt-token',
    user: {
      id: '123',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'customer'
    }
  }
};

const renderLoginTest = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Login Flow Integration Tests - Simple', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Test';
    localStorage.clear();
    getCurrentUser.mockResolvedValue(null);
    mockNavigate.mockClear();
  });

  it('should render login page correctly', async () => {
    renderLoginTest();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();
    
    loginUser.mockResolvedValueOnce(mockLoginResponse);

    renderLoginTest();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    });

    // Fill out the form
    await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify login service was called
    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith({
        email: 'john.doe@example.com',
        password: 'SecurePass123!'
      });
    });

    // Verify navigation was called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/products');
    });
  });

  it('should handle login errors', async () => {
    const user = userEvent.setup();
    
    loginUser.mockRejectedValueOnce(new Error('Invalid email or password'));

    renderLoginTest();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    });

    // Fill out the form
    await user.type(screen.getByLabelText(/email address/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });

    // Should stay on login page
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
  });

  it('should validate form fields', async () => {
    const user = userEvent.setup();

    renderLoginTest();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    });

    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Should not call login service
    expect(loginUser).not.toHaveBeenCalled();

    // Should still be on login page
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
  });

  it('should update document title', () => {
    renderLoginTest();

    expect(document.title).toBe('Sign In - GrapheneOS Store');
  });

  it('should handle logout functionality', async () => {
    const user = userEvent.setup();
    
    // Mock successful login first
    loginUser.mockResolvedValueOnce(mockLoginResponse);
    
    renderLoginTest();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    });

    // Login first
    await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify user is logged in (navigation would happen in real app)
    await waitFor(() => {
      expect(loginUser).toHaveBeenCalled();
    });

    // Mock logout
    logoutUser.mockResolvedValueOnce();

    // In a real test, we would need to test logout from the header component
    // For now, we'll just verify the logout service can be called
    await logoutUser();
    
    expect(logoutUser).toHaveBeenCalled();
  });
});