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

const mockUser = {
  id: '123',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'customer'
};

const mockFetch = vi.fn();
global.fetch = mockFetch;

const renderChangePasswordPage = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ChangePasswordPage />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('ChangePasswordPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => 'mock-jwt-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });

    // Mock successful auth profile call
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/auth/profile') && !url.includes('PUT')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { user: mockUser }
          })
        });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });
  });

  it('should complete the full password change flow successfully', async () => {
    const user = userEvent.setup();
    
    // Mock successful password change API call
    mockFetch.mockImplementation((url, options) => {
      if (url.includes('/api/auth/profile') && options?.method !== 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { user: mockUser }
          })
        });
      }
      
      if (url.includes('/api/auth/password') && options?.method === 'PUT') {
        const body = JSON.parse(options.body);
        
        // Validate request body
        expect(body).toMatchObject({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewSecurePass456@',
          confirmNewPassword: 'NewSecurePass456@'
        });
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            message: 'Password changed successfully'
          })
        });
      }
      
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    renderChangePasswordPage();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
    });

    // Fill out the form
    await user.type(screen.getByLabelText(/current password/i), 'OldPassword123!');
    await user.type(screen.getByLabelText('New Password *'), 'NewSecurePass456@');
    await user.type(screen.getByLabelText('Confirm New Password *'), 'NewSecurePass456@');

    // Verify password strength shows as strong
    await waitFor(() => {
      expect(screen.getByText('strong')).toBeInTheDocument();
    });

    // Submit the form
    await user.click(screen.getByRole('button', { name: /update password/i }));

    // Verify success message appears
    await waitFor(() => {
      expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument();
    });

    // Verify redirect to login page occurs
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    }, { timeout: 3000 });

    // Verify token was removed from localStorage
    expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    mockFetch.mockImplementation((url, options) => {
      if (url.includes('/api/auth/profile') && options?.method !== 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { user: mockUser }
          })
        });
      }
      
      if (url.includes('/api/auth/password') && options?.method === 'PUT') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            success: false,
            error: 'Current password is incorrect'
          })
        });
      }
      
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    renderChangePasswordPage();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
    });

    // Fill out the form with incorrect current password
    await user.type(screen.getByLabelText(/current password/i), 'WrongPassword123!');
    await user.type(screen.getByLabelText('New Password *'), 'NewSecurePass456@');
    await user.type(screen.getByLabelText('Confirm New Password *'), 'NewSecurePass456@');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /update password/i }));

    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
    });

    // Verify no redirect occurred
    expect(mockNavigate).not.toHaveBeenCalledWith('/login');
  });
});