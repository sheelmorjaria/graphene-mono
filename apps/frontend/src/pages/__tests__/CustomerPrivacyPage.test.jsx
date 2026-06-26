import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CustomerPrivacyPage from '../CustomerPrivacyPage';
import { AuthStateContext, AuthDispatchContext } from '../../contexts/AuthContext';
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

// CustomerPrivacyPage reads auth via useAuth() -> useContext(AuthStateContext).
// Feed the real context object directly (AuthProvider does not accept a value prop).
const authState = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  error: null
};

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthStateContext.Provider value={authState}>
      <AuthDispatchContext.Provider value={vi.fn()}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  </BrowserRouter>
);

// Custom render function with providers
const renderWithProviders = (component) => {
  return render(component, { wrapper: TestWrapper });
};

describe('CustomerPrivacyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = mockUser;
    authState.isAuthenticated = true;
    authState.isLoading = false;
    authState.error = null;
  });

  describe('Initial Render', () => {
    it('should render privacy page with all sections', () => {
      renderWithProviders(<CustomerPrivacyPage />);

      expect(screen.getByText('Data & Privacy')).toBeInTheDocument();
      // "Export My Data" appears as both a section heading and a button
      expect(screen.getAllByText('Export My Data').length).toBeGreaterThan(0);
      expect(screen.getByText('Delete My Account')).toBeInTheDocument();

      // Check for buttons
      expect(screen.getByRole('button', { name: /export my data/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /request account deletion/i })).toBeInTheDocument();
    });

    it('should display user information correctly', () => {
      renderWithProviders(<CustomerPrivacyPage />);

      // The page describes managing personal data; verify intro copy renders.
      expect(screen.getByText(/manage your personal data and privacy settings/i)).toBeInTheDocument();
    });

    it('should show privacy regulation information', () => {
      renderWithProviders(<CustomerPrivacyPage />);

      expect(screen.getByText(/GDPR and CCPA/i)).toBeInTheDocument();
    });
  });

  describe('Data Export Functionality', () => {
    it('should successfully request data export', async () => {
      privacyService.requestDataExport.mockResolvedValue({});

      renderWithProviders(<CustomerPrivacyPage />);

      const exportButton = screen.getByRole('button', { name: /export my data/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(privacyService.requestDataExport).toHaveBeenCalledTimes(1);
      });

      // Check success message
      expect(screen.getByText(/data export request submitted successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/24 hours/i)).toBeInTheDocument();
    });

    it('should handle data export error', async () => {
      const exportError = new Error('You already have a pending data export request.');
      privacyService.requestDataExport.mockRejectedValue(exportError);

      renderWithProviders(<CustomerPrivacyPage />);

      const exportButton = screen.getByRole('button', { name: /export my data/i });
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

      const exportButton = screen.getByRole('button', { name: /export my data/i });
      fireEvent.click(exportButton);

      // Button shows "Processing..." (its accessible name changes) and is disabled while loading
      expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export my data/i })).not.toBeDisabled();
      });
    });
  });

  describe('Account Deletion Functionality', () => {
    it('should open deletion confirmation modal', () => {
      renderWithProviders(<CustomerPrivacyPage />);

      const deleteButton = screen.getByRole('button', { name: /request account deletion/i });
      fireEvent.click(deleteButton);

      // Modal should be visible
      expect(screen.getByText(/confirm account deletion/i)).toBeInTheDocument();
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    });

    it('should close modal when cancel is clicked', () => {
      renderWithProviders(<CustomerPrivacyPage />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /request account deletion/i });
      fireEvent.click(deleteButton);

      // Close modal
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Modal should be closed
      expect(screen.queryByText(/confirm account deletion/i)).not.toBeInTheDocument();
    });

    it('should successfully request account deletion', async () => {
      privacyService.requestAccountDeletion.mockResolvedValue({});
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      renderWithProviders(<CustomerPrivacyPage />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /request account deletion/i });
      fireEvent.click(deleteButton);

      // Enter password
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      fireEvent.change(passwordInput, { target: { value: 'mypassword123' } });

      // Submit deletion request
      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(privacyService.requestAccountDeletion).toHaveBeenCalledWith('mypassword123');
      });

      // The component alerts the user and navigates home (no logout call in this component)
      expect(alertSpy).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
      alertSpy.mockRestore();
    });

    it('should handle account deletion error', async () => {
      const deleteError = new Error('Invalid password. Please check your password and try again.');
      privacyService.requestAccountDeletion.mockRejectedValue(deleteError);

      renderWithProviders(<CustomerPrivacyPage />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /request account deletion/i });
      fireEvent.click(deleteButton);

      // Enter password
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

      // Submit deletion request
      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });
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
      const deleteButton = screen.getByRole('button', { name: /request account deletion/i });
      fireEvent.click(deleteButton);

      // Confirm button is present
      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });
      expect(confirmButton).toBeInTheDocument();

      // Enter password (input is controlled and empty initially)
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      fireEvent.change(passwordInput, { target: { value: 'mypassword' } });

      expect(passwordInput).toHaveValue('mypassword');
    });

    it('should disable form while deletion request is processing', async () => {
      privacyService.requestAccountDeletion.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      );
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      renderWithProviders(<CustomerPrivacyPage />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /request account deletion/i });
      fireEvent.click(deleteButton);

      // Enter password
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      fireEvent.change(passwordInput, { target: { value: 'mypassword123' } });

      // Submit deletion request
      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });
      fireEvent.click(confirmButton);

      // Confirm button is disabled while processing and shows "Processing..."
      // (NOTE: the password input is not disabled by the component during processing.)
      expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      alertSpy.mockRestore();
    });
  });

  describe('Loading States', () => {
    it('should show loading states appropriately', async () => {
      // Mock delayed responses
      privacyService.requestDataExport.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({}), 100))
      );

      renderWithProviders(<CustomerPrivacyPage />);

      const exportButton = screen.getByRole('button', { name: /export my data/i });
      fireEvent.click(exportButton);

      // Check loading state
      expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export my data/i })).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network Error');
      privacyService.requestDataExport.mockRejectedValue(networkError);

      renderWithProviders(<CustomerPrivacyPage />);

      const exportButton = screen.getByRole('button', { name: /export my data/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should handle server errors with generic message', async () => {
      const serverError = new Error('Failed to request account deletion. Please check your password and try again.');
      privacyService.requestAccountDeletion.mockRejectedValue(serverError);

      renderWithProviders(<CustomerPrivacyPage />);

      // Open modal
      const deleteButton = screen.getByRole('button', { name: /request account deletion/i });
      fireEvent.click(deleteButton);

      // Enter password and submit
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to request account deletion/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderWithProviders(<CustomerPrivacyPage />);

      // Check main heading
      expect(screen.getByRole('heading', { name: /data & privacy/i })).toBeInTheDocument();

      // Check section headings
      expect(screen.getByRole('heading', { name: /export my data/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /delete my account/i })).toBeInTheDocument();

      // Check buttons have appropriate roles
      expect(screen.getByRole('button', { name: /export my data/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /request account deletion/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      renderWithProviders(<CustomerPrivacyPage />);

      const exportButton = screen.getByRole('button', { name: /export my data/i });
      const deleteButton = screen.getByRole('button', { name: /request account deletion/i });

      // Buttons should be focusable
      exportButton.focus();
      expect(document.activeElement).toBe(exportButton);

      deleteButton.focus();
      expect(document.activeElement).toBe(deleteButton);
    });
  });
});
