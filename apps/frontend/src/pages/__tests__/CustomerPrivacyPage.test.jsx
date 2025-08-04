import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CustomerPrivacyPage from '../CustomerPrivacyPage';
import { AuthProvider } from '../../contexts/AuthContext';
import * as privacyService from '../../services/privacyService';

// Mock the privacy service
vi.mock('../../services/privacyService', () => ({
  requestDataExport: vi.fn(),
  requestAccountDeletion: vi.fn()
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock user context
const mockUser = {
  _id: 'user123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com'
};

const mockAuthContextValue = {
  user: mockUser,
  logout: vi.fn()
};

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider value={mockAuthContextValue}>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

// Custom render function with providers
const renderWithProviders = (component) => {
  return render(component, { wrapper: TestWrapper });
};

describe('CustomerPrivacyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render privacy page with all sections', () => {
      renderWithProviders(<CustomerPrivacyPage />);

      expect(screen.getByText('Data & Privacy')).toBeInTheDocument();
      expect(screen.getByText('Your Privacy Rights')).toBeInTheDocument();
      expect(screen.getByText('Export My Data')).toBeInTheDocument();
      expect(screen.getByText('Delete My Account')).toBeInTheDocument();
      
      // Check for buttons
      expect(screen.getByRole('button', { name: /request data export/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
    });

    it('should display user information correctly', () => {
      renderWithProviders(<CustomerPrivacyPage />);

      expect(screen.getByText(/john\.doe@example\.com/)).toBeInTheDocument();
    });

    it('should show privacy rights information', () => {
      renderWithProviders(<CustomerPrivacyPage />);

      expect(screen.getByText(/right to access your personal data/i)).toBeInTheDocument();
      expect(screen.getByText(/right to rectification/i)).toBeInTheDocument();
      expect(screen.getByText(/right to erasure/i)).toBeInTheDocument();
      expect(screen.getByText(/right to data portability/i)).toBeInTheDocument();
    });
  });

  describe('Data Export Functionality', () => {
    it('should successfully request data export', async () => {
      const mockResponse = {
        success: true,
        message: 'Data export request received.',
        data: {
          requestId: 'export_123',
          estimatedTime: '24 hours'
        }
      };
      privacyService.requestDataExport.mockResolvedValue(mockResponse);

      renderWithProviders(<CustomerPrivacyPage />);

      const exportButton = screen.getByRole('button', { name: /request data export/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(privacyService.requestDataExport).toHaveBeenCalledTimes(1);
      });

      // Check success message
      expect(screen.getByText(/data export request received/i)).toBeInTheDocument();
      expect(screen.getByText(/24 hours/)).toBeInTheDocument();
    });

    it('should handle data export error', async () => {
      const mockError = {
        response: {
          data: {
            error: 'You already have a pending data export request.'
          }
        }
      };
      privacyService.requestDataExport.mockRejectedValue(mockError);

      renderWithProviders(<CustomerPrivacyPage />);

      const exportButton = screen.getByRole('button', { name: /request data export/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/you already have a pending data export request/i)).toBeInTheDocument();
      });
    });

    it('should disable export button while request is loading', async () => {
      privacyService.requestDataExport.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      renderWithProviders(<CustomerPrivacyPage />);

      const exportButton = screen.getByRole('button', { name: /request data export/i });
      fireEvent.click(exportButton);

      // Button should be disabled while loading
      expect(exportButton).toBeDisabled();
      expect(screen.getByText(/requesting\.\.\./i)).toBeInTheDocument();

      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
      });
    });
  });

  describe('Account Deletion Functionality', () => {
    it('should open deletion confirmation modal', () => {
      renderWithProviders(<CustomerPrivacyPage />);

      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      fireEvent.click(deleteButton);

      // Modal should be visible
      expect(screen.getByText(/confirm account deletion/i)).toBeInTheDocument();
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    });

    it('should close modal when cancel is clicked', () => {
      renderWithProviders(<CustomerPrivacyPage />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      fireEvent.click(deleteButton);

      // Close modal
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Modal should be closed
      expect(screen.queryByText(/confirm account deletion/i)).not.toBeInTheDocument();
    });

    it('should successfully request account deletion', async () => {
      const mockResponse = {
        success: true,
        message: 'Account deletion request received.',
        data: {
          requestId: 'deletion_123',
          estimatedTime: '7-30 days'
        }
      };
      privacyService.requestAccountDeletion.mockResolvedValue(mockResponse);

      renderWithProviders(<CustomerPrivacyPage />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      fireEvent.click(deleteButton);

      // Enter password
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      fireEvent.change(passwordInput, { target: { value: 'mypassword123' } });

      // Submit deletion request
      const confirmButton = screen.getByRole('button', { name: /delete my account/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(privacyService.requestAccountDeletion).toHaveBeenCalledWith('mypassword123');
      });

      // Check success message and logout
      expect(screen.getByText(/account deletion request received/i)).toBeInTheDocument();
      expect(mockAuthContextValue.logout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should handle account deletion error', async () => {
      const mockError = {
        response: {
          data: {
            error: 'Invalid password. Please check your password and try again.'
          }
        }
      };
      privacyService.requestAccountDeletion.mockRejectedValue(mockError);

      renderWithProviders(<CustomerPrivacyPage />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      fireEvent.click(deleteButton);

      // Enter password
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

      // Submit deletion request
      const confirmButton = screen.getByRole('button', { name: /delete my account/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid password/i)).toBeInTheDocument();
      });

      // Modal should still be open to allow retry
      expect(screen.getByText(/confirm account deletion/i)).toBeInTheDocument();
    });

    it('should require password for account deletion', () => {
      renderWithProviders(<CustomerPrivacyPage />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      fireEvent.click(deleteButton);

      // Try to submit without password
      const confirmButton = screen.getByRole('button', { name: /delete my account/i });
      expect(confirmButton).toBeDisabled();

      // Enter password
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      fireEvent.change(passwordInput, { target: { value: 'mypassword' } });

      // Button should now be enabled
      expect(confirmButton).not.toBeDisabled();
    });

    it('should disable form while deletion request is processing', async () => {
      privacyService.requestAccountDeletion.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      renderWithProviders(<CustomerPrivacyPage />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      fireEvent.click(deleteButton);

      // Enter password
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      fireEvent.change(passwordInput, { target: { value: 'mypassword123' } });

      // Submit deletion request
      const confirmButton = screen.getByRole('button', { name: /delete my account/i });
      fireEvent.click(confirmButton);

      // Form should be disabled while processing
      expect(confirmButton).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(screen.getByText(/processing\.\.\./i)).toBeInTheDocument();

      await waitFor(() => {
        expect(mockAuthContextValue.logout).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading states appropriately', async () => {
      // Mock delayed responses
      privacyService.requestDataExport.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      renderWithProviders(<CustomerPrivacyPage />);

      const exportButton = screen.getByRole('button', { name: /request data export/i });
      fireEvent.click(exportButton);

      // Check loading state
      expect(exportButton).toBeDisabled();
      expect(screen.getByText(/requesting\.\.\./i)).toBeInTheDocument();

      await waitFor(() => {
        expect(exportButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network Error');
      privacyService.requestDataExport.mockRejectedValue(networkError);

      renderWithProviders(<CustomerPrivacyPage />);

      const exportButton = screen.getByRole('button', { name: /request data export/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('should handle server errors with generic message', async () => {
      const serverError = {
        response: {
          status: 500,
          data: {
            error: 'Internal server error'
          }
        }
      };
      privacyService.requestAccountDeletion.mockRejectedValue(serverError);

      renderWithProviders(<CustomerPrivacyPage />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      fireEvent.click(deleteButton);

      // Enter password and submit
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const confirmButton = screen.getByRole('button', { name: /delete my account/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderWithProviders(<CustomerPrivacyPage />);

      // Check main heading
      expect(screen.getByRole('heading', { name: /data & privacy/i })).toBeInTheDocument();

      // Check section headings
      expect(screen.getByRole('heading', { name: /your privacy rights/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /export my data/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /delete my account/i })).toBeInTheDocument();

      // Check buttons have appropriate roles
      expect(screen.getByRole('button', { name: /request data export/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      renderWithProviders(<CustomerPrivacyPage />);

      const exportButton = screen.getByRole('button', { name: /request data export/i });
      const deleteButton = screen.getByRole('button', { name: /delete account/i });

      // Buttons should be focusable
      exportButton.focus();
      expect(document.activeElement).toBe(exportButton);

      deleteButton.focus();
      expect(document.activeElement).toBe(deleteButton);
    });
  });
});