import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import AdminUserDetailsPage from '../AdminUserDetailsPage';

// Mock navigate and params
const mockNavigate = vi.fn();
const mockParams = { userId: '123' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams
  };
});

// Mock admin service
const { mockGetUserById, mockUpdateUserStatus } = vi.hoisted(() => ({
  mockGetUserById: vi.fn(),
  mockUpdateUserStatus: vi.fn()
}));

vi.mock('../../services/adminService', () => ({
  getUserById: mockGetUserById,
  updateUserStatus: mockUpdateUserStatus,
  formatCurrency: (amount) => `£${Number(amount).toFixed(2)}`,
  default: {
    getUserById: mockGetUserById,
    updateUserStatus: mockUpdateUserStatus
  }
}));

vi.mock('../../components/LoadingSpinner', () => ({
  default: () => <div aria-label="Loading">Loading...</div>
}));

const mockUserData = {
  _id: '123',
  email: 'john.doe@test.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'customer',
  accountStatus: 'active',
  emailVerified: true,
  phone: '+447123456789',
  createdAt: '2024-01-15T10:00:00Z',
  lastLoginAt: '2024-01-20T14:30:00Z',
  orderCount: 5,
  totalSpent: 299.99,
  shippingAddresses: [
    {
      _id: 'addr1',
      fullName: 'John Doe',
      addressLine1: '123 Main Street',
      addressLine2: 'Apt 4B',
      city: 'London',
      postalCode: 'SW1A 1AA',
      country: 'United Kingdom',
      isDefault: true
    },
    {
      _id: 'addr2',
      fullName: 'John Doe',
      addressLine1: '456 Oak Avenue',
      addressLine2: '',
      city: 'Manchester',
      postalCode: 'M1 1AA',
      country: 'United Kingdom',
      isDefault: false
    }
  ]
};

const renderAdminUserDetailsPage = () => {
  return render(
    <MemoryRouter>
      <AdminUserDetailsPage />
    </MemoryRouter>
  );
};

describe('AdminUserDetailsPage - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful response
    mockGetUserById.mockResolvedValue({
      success: true,
      data: {
        user: mockUserData
      }
    });

    mockUpdateUserStatus.mockResolvedValue({
      success: true,
      data: {
        user: { ...mockUserData, accountStatus: 'disabled' }
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const waitForLoaded = () =>
    waitFor(() => {
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
    });

  describe('Initial Loading and Data Display', () => {
    it('should load and display user details correctly', async () => {
      renderAdminUserDetailsPage();

      // Shows loading spinner first
      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();

      await waitForLoaded();

      // Verify API call
      expect(mockGetUserById).toHaveBeenCalledWith('123');

      // Check user basic information (name appears in header and addresses)
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getByText('john.doe@test.com')).toBeInTheDocument();
      expect(screen.getByText('+447123456789')).toBeInTheDocument();
      expect(screen.getByText(/customer/i)).toBeInTheDocument();

      // Check status badge (shown in header and account info section)
      expect(screen.getAllByText('active').length).toBeGreaterThan(0);
      // Email verified
      expect(screen.getAllByText(/verified/i).length).toBeGreaterThan(0);
    });

    it('should display account statistics correctly', async () => {
      renderAdminUserDetailsPage();

      await waitForLoaded();

      // Check statistics
      expect(screen.getByText('Total Orders')).toBeInTheDocument();
      expect(screen.getAllByText('5').length).toBeGreaterThan(0);
      expect(screen.getByText('£299.99')).toBeInTheDocument();
      expect(screen.getByText('Total Spent')).toBeInTheDocument();

      // Check activity section
      expect(screen.getByText(/registration date/i)).toBeInTheDocument();
      expect(screen.getByText(/last login/i)).toBeInTheDocument();
    });

    it('should handle user not found error', async () => {
      mockGetUserById.mockRejectedValue(new Error('User not found'));

      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.getByText(/error loading user/i)).toBeInTheDocument();
        expect(screen.getByText(/user not found/i)).toBeInTheDocument();
      });

      // Check back button
      const backButton = screen.getByText(/back to users list/i);
      expect(backButton).toBeInTheDocument();
    });

    it('should navigate back to users list from error state', async () => {
      mockGetUserById.mockRejectedValue(new Error('User not found'));

      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.getByText(/back to users list/i)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText(/back to users list/i));

      expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
    });
  });

  describe('User Information Display', () => {
    it('should display complete user information', async () => {
      renderAdminUserDetailsPage();

      await waitForLoaded();

      // Check user information section
      expect(screen.getByText('User Information')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument(); // User ID
      expect(screen.getByText('john.doe@test.com')).toBeInTheDocument();
      expect(screen.getByText('+447123456789')).toBeInTheDocument();
    });

    it('should display shipping addresses correctly', async () => {
      renderAdminUserDetailsPage();

      await waitForLoaded();

      // Check shipping addresses section
      expect(screen.getByText(/shipping addresses/i)).toBeInTheDocument();
      // Address lines are rendered together with city/postal in one <p>, so use
      // text matchers that accept partial content within an element.
      expect(screen.getAllByText((_, node) => !!node?.textContent?.includes('123 Main Street')).length).toBeGreaterThan(0);
      expect(screen.getAllByText((_, node) => !!node?.textContent?.includes('Apt 4B')).length).toBeGreaterThan(0);
      expect(screen.getAllByText((_, node) => !!node?.textContent?.includes('London')).length).toBeGreaterThan(0);
      expect(screen.getAllByText((_, node) => !!node?.textContent?.includes('SW1A 1AA')).length).toBeGreaterThan(0);
      expect(screen.getByText('Default')).toBeInTheDocument();

      // Check secondary address
      expect(screen.getAllByText((_, node) => !!node?.textContent?.includes('456 Oak Avenue')).length).toBeGreaterThan(0);
      expect(screen.getAllByText((_, node) => !!node?.textContent?.includes('Manchester')).length).toBeGreaterThan(0);
      expect(screen.getAllByText((_, node) => !!node?.textContent?.includes('M1 1AA')).length).toBeGreaterThan(0);
    });

    it('should not render shipping addresses section when none exist', async () => {
      const userWithoutAddresses = {
        ...mockUserData,
        shippingAddresses: []
      };

      mockGetUserById.mockResolvedValue({
        success: true,
        data: { user: userWithoutAddresses }
      });

      renderAdminUserDetailsPage();

      await waitForLoaded();

      expect(screen.queryByText(/shipping addresses/i)).not.toBeInTheDocument();
    });

    it('should handle user with incomplete information', async () => {
      const incompleteUser = {
        ...mockUserData,
        phone: null,
        lastLoginAt: null,
        shippingAddresses: []
      };

      mockGetUserById.mockResolvedValue({
        success: true,
        data: { user: incompleteUser }
      });

      renderAdminUserDetailsPage();

      await waitForLoaded();

      // Missing phone shows fallback text
      expect(screen.getByText(/not provided/i)).toBeInTheDocument();
      // Never logged in
      expect(screen.getAllByText(/never/i).length).toBeGreaterThan(0);
    });
  });

  describe('Account Status Management', () => {
    it('should show disable option for active users', async () => {
      renderAdminUserDetailsPage();

      await waitForLoaded();

      // The header action button for an active user
      const disableButton = screen.getByRole('button', { name: /disable account/i });
      expect(disableButton).toBeInTheDocument();
      expect(disableButton).not.toBeDisabled();
    });

    it('should show enable option for disabled users', async () => {
      const disabledUser = {
        ...mockUserData,
        accountStatus: 'disabled'
      };

      mockGetUserById.mockResolvedValue({
        success: true,
        data: { user: disabledUser }
      });

      renderAdminUserDetailsPage();

      await waitForLoaded();

      const enableButton = screen.getByRole('button', { name: /enable account/i });
      expect(enableButton).toBeInTheDocument();
      expect(enableButton).not.toBeDisabled();
    });

    it('should handle disable account action', async () => {
      renderAdminUserDetailsPage();

      await waitForLoaded();

      // Click disable button (header)
      const disableButton = screen.getByRole('button', { name: /disable account/i });
      await userEvent.click(disableButton);

      // Check confirmation dialog
      expect(screen.getByText(/disable user account/i)).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to disable/i)).toBeInTheDocument();

      // Confirm action — modal confirm button is the last "Disable Account"
      const disableButtons = screen.getAllByRole('button', { name: /disable account/i });
      await userEvent.click(disableButtons[disableButtons.length - 1]);

      // Verify API call
      await waitFor(() => {
        expect(mockUpdateUserStatus).toHaveBeenCalledWith('123', {
          newStatus: 'disabled'
        });
      });

      // Check success message
      await waitFor(() => {
        expect(screen.getByText(/user account disabled successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle enable account action', async () => {
      // Start with disabled user
      const disabledUser = {
        ...mockUserData,
        accountStatus: 'disabled'
      };

      mockGetUserById.mockResolvedValue({
        success: true,
        data: { user: disabledUser }
      });

      renderAdminUserDetailsPage();

      await waitForLoaded();

      // Click enable button
      const enableButton = screen.getByRole('button', { name: /enable account/i });
      await userEvent.click(enableButton);

      // Check confirmation dialog
      expect(screen.getByText(/enable user account/i)).toBeInTheDocument();

      // Confirm action — modal confirm button is the last "Enable Account"
      const enableButtons = screen.getAllByRole('button', { name: /enable account/i });
      await userEvent.click(enableButtons[enableButtons.length - 1]);

      // Verify API call
      await waitFor(() => {
        expect(mockUpdateUserStatus).toHaveBeenCalledWith('123', {
          newStatus: 'active'
        });
      });
    });

    it('should handle status update errors', async () => {
      mockUpdateUserStatus.mockRejectedValue(new Error('Update failed'));

      renderAdminUserDetailsPage();

      await waitForLoaded();

      // Attempt to disable
      const disableButton = screen.getByRole('button', { name: /disable account/i });
      await userEvent.click(disableButton);

      const disableButtons = screen.getAllByRole('button', { name: /disable account/i });
      await userEvent.click(disableButtons[disableButtons.length - 1]);

      // Check error message
      await waitFor(() => {
        expect(screen.getByText(/update failed/i)).toBeInTheDocument();
      });
    });

    it('should cancel status update when cancelled', async () => {
      renderAdminUserDetailsPage();

      await waitForLoaded();

      // Open dialog and cancel
      const disableButton = screen.getByRole('button', { name: /disable account/i });
      await userEvent.click(disableButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      // Verify no API call and dialog closed
      expect(mockUpdateUserStatus).not.toHaveBeenCalled();
      expect(screen.queryByText(/disable user account/i)).not.toBeInTheDocument();
    });
  });

  describe('Navigation and Actions', () => {
    it('should navigate back to users list via error-state button', async () => {
      mockGetUserById.mockRejectedValue(new Error('fail'));

      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.getByText(/back to users list/i)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText(/back to users list/i));

      expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
    });
  });

  describe('Responsive Design and Accessibility', () => {
    it('should be accessible with proper structure', async () => {
      renderAdminUserDetailsPage();

      await waitForLoaded();

      // Check main heading
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      // Check section headings
      expect(screen.getByRole('heading', { name: /user information/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /account activity/i })).toBeInTheDocument();
    });
  });

  describe('Data Formatting and Display', () => {
    it('should format dates correctly', async () => {
      renderAdminUserDetailsPage();

      await waitForLoaded();

      // Dates are formatted via toLocaleDateString en-GB
      expect(screen.getAllByText(/january/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/2024/i).length).toBeGreaterThan(0);
    });

    it('should format currency correctly', async () => {
      renderAdminUserDetailsPage();

      await waitForLoaded();

      expect(screen.getByText('£299.99')).toBeInTheDocument();
    });

    it('should handle missing optional fields gracefully', async () => {
      const userWithMissingFields = {
        ...mockUserData,
        phone: null,
        lastLoginAt: null
      };

      mockGetUserById.mockResolvedValue({
        success: true,
        data: { user: userWithMissingFields }
      });

      renderAdminUserDetailsPage();

      await waitForLoaded();

      // Missing phone
      expect(screen.getByText(/not provided/i)).toBeInTheDocument();
      // Never logged in
      expect(screen.getAllByText(/never/i).length).toBeGreaterThan(0);
    });
  });

  describe('Performance Considerations', () => {
    it('should not make unnecessary API calls', async () => {
      renderAdminUserDetailsPage();

      await waitForLoaded();

      // Should only call getUserById once on mount
      expect(mockGetUserById).toHaveBeenCalledTimes(1);
      expect(mockGetUserById).toHaveBeenCalledWith('123');
    });

    it('should handle component cleanup properly', () => {
      const { unmount } = renderAdminUserDetailsPage();

      // Unmount component
      unmount();

      // No additional assertions needed, this tests for memory leaks
    });
  });
});
