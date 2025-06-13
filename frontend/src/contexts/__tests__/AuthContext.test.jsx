import React from 'react';
import { render, screen, waitFor, act } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth, useLogout, useLogin, withAuth } from '../AuthContext';

// Mock auth service
vi.mock('../../services/authService', () => ({
  getCurrentUser: vi.fn(),
  logoutUser: vi.fn()
}));

import { getCurrentUser, logoutUser } from '../../services/authService';

// Test component that uses auth context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, error } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no-user'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
    </div>
  );
};

// Test component with logout functionality
const LogoutTestComponent = () => {
  const logout = useLogout();
  const { isAuthenticated } = useAuth();
  
  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <button onClick={logout} data-testid="logout-button">Logout</button>
    </div>
  );
};

// Test component with login functionality
const LoginTestComponent = () => {
  const login = useLogin();
  const { isAuthenticated, user } = useAuth();
  
  const handleLogin = () => {
    login({ id: '123', email: 'test@example.com', firstName: 'Test' });
  };
  
  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no-user'}</div>
      <button onClick={handleLogin} data-testid="login-button">Login</button>
    </div>
  );
};

// Protected component for testing withAuth HOC
const ProtectedComponent = () => {
  return <div data-testid="protected-content">Protected Content</div>;
};

const WrappedProtectedComponent = withAuth(ProtectedComponent);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AuthProvider', () => {
    it('should provide initial loading state', () => {
      getCurrentUser.mockResolvedValue(null);
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });

    it('should set authenticated state when user exists', async () => {
      const mockUser = { id: '123', email: 'test@example.com', firstName: 'Test' };
      getCurrentUser.mockResolvedValue(mockUser);
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
        expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      });
    });

    it('should handle authentication errors', async () => {
      const error = new Error('Auth failed');
      getCurrentUser.mockRejectedValue(error);
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
        expect(screen.getByTestId('error')).toHaveTextContent('Auth failed');
      });
    });

    it('should set not authenticated when no user', async () => {
      getCurrentUser.mockResolvedValue(null);
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });
    });
  });

  describe('useLogout', () => {
    it('should logout user and update state', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      getCurrentUser.mockResolvedValue(mockUser);
      
      render(
        <AuthProvider>
          <LogoutTestComponent />
        </AuthProvider>
      );

      // Wait for initial auth check
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      // Logout
      act(() => {
        screen.getByTestId('logout-button').click();
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(logoutUser).toHaveBeenCalled();
    });
  });

  describe('useLogin', () => {
    it('should login user and update state', async () => {
      getCurrentUser.mockResolvedValue(null);
      
      render(
        <AuthProvider>
          <LoginTestComponent />
        </AuthProvider>
      );

      // Wait for initial auth check
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      });

      // Login
      act(() => {
        screen.getByTestId('login-button').click();
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('{"id":"123","email":"test@example.com","firstName":"Test"}');
    });
  });

  describe('withAuth HOC', () => {
    it('should show loading when auth is loading', () => {
      getCurrentUser.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(
        <AuthProvider>
          <WrappedProtectedComponent />
        </AuthProvider>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should show login prompt when not authenticated', async () => {
      getCurrentUser.mockResolvedValue(null);
      
      render(
        <AuthProvider>
          <WrappedProtectedComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Authentication Required')).toBeInTheDocument();
        expect(screen.getByText('Sign In')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });

    it('should render protected component when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      getCurrentUser.mockResolvedValue(mockUser);
      
      render(
        <AuthProvider>
          <WrappedProtectedComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useAuth is used outside provider', () => {
      // Suppress console error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuthState must be used within an AuthProvider');

      console.error = originalError;
    });
  });
});