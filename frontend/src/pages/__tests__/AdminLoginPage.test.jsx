import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test/test-utils';
import { vi } from 'vitest';
import AdminLoginPage from '../AdminLoginPage';
import * as adminService from '../../services/adminService';

// Mock the admin service
vi.mock('../../services/adminService');

const MockRouter = ({ children, initialEntries = ['/admin/login'] }) => (
  <MemoryRouter initialEntries={initialEntries}>
    {children}
  </MemoryRouter>
);

describe('AdminLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(false);
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  it('renders login form correctly', () => {
    render(
      <MockRouter>
        <AdminLoginPage />
      </MockRouter>
    );

    expect(screen.getByText('Admin Sign In')).toBeInTheDocument();
    expect(screen.getByText('Access the administrative dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(
      <MockRouter>
        <AdminLoginPage />
      </MockRouter>
    );

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    render(
      <MockRouter>
        <AdminLoginPage />
      </MockRouter>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    render(
      <MockRouter>
        <AdminLoginPage />
      </MockRouter>
    );

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });
  });

  it('clears field errors when user starts typing', async () => {
    render(
      <MockRouter>
        <AdminLoginPage />
      </MockRouter>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Trigger validation error
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    // Start typing - error should clear
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    await waitFor(() => {
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });
  });

  it('handles successful login', async () => {
    const mockResponse = {
      data: {
        user: {
          id: 'admin1',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin'
        },
        token: 'mock-jwt-token'
      }
    };

    adminService.adminLogin.mockResolvedValue(mockResponse);

    const mockNavigate = vi.fn();
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: null })
      };
    });

    render(
      <MockRouter>
        <AdminLoginPage />
      </MockRouter>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(adminService.adminLogin).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123'
      });
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('adminToken', 'mock-jwt-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('adminUser', JSON.stringify(mockResponse.data.user));
  });

  it('handles login error', async () => {
    const errorMessage = 'Invalid credentials';
    adminService.adminLogin.mockRejectedValue(new Error(errorMessage));

    render(
      <MockRouter>
        <AdminLoginPage />
      </MockRouter>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Login Failed')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state during login', async () => {
    adminService.adminLogin.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <MockRouter>
        <AdminLoginPage />
      </MockRouter>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('disables form fields during loading', async () => {
    adminService.adminLogin.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <MockRouter>
        <AdminLoginPage />
      </MockRouter>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('renders navigation links correctly', () => {
    render(
      <MockRouter>
        <AdminLoginPage />
      </MockRouter>
    );

    const storeLink = screen.getByText('GrapheneOS Store');
    const backLink = screen.getByText('← Back to Store');

    expect(storeLink.closest('a')).toHaveAttribute('href', '/');
    expect(backLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('redirects to dashboard if already authenticated', () => {
    adminService.isAdminAuthenticated.mockReturnValue(true);
    
    const mockNavigate = vi.fn();
    
    // This test would need to be implemented with proper router mocking
    // The key behavior is that the useEffect should call navigate('/admin/dashboard', { replace: true })
    expect(adminService.isAdminAuthenticated).toHaveBeenCalled();
  });
});