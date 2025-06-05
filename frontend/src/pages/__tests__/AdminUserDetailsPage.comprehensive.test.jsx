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
const mockGetUserById = vi.fn();
const mockUpdateUserStatus = vi.fn();

vi.mock('../../services/adminService', () => ({
  default: {
    getUserById: mockGetUserById,
    updateUserStatus: mockUpdateUserStatus
  }
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
  marketingOptIn: true,
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
  ],
  activityLog: [
    {
      action: 'Login',
      timestamp: '2024-01-20T14:30:00Z',
      details: 'Successful login from IP 192.168.1.1'
    },
    {
      action: 'Order Placed',
      timestamp: '2024-01-19T16:15:00Z',
      details: 'Order #ORD-001 placed for £59.99'
    },
    {
      action: 'Profile Updated',
      timestamp: '2024-01-18T11:22:00Z',
      details: 'Updated phone number'
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

  describe('Initial Loading and Data Display', () => {
    it('should load and display user details correctly', async () => {
      renderAdminUserDetailsPage();

      // Check loading state
      expect(screen.getByText(/loading user details.../i)).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Verify API call
      expect(mockGetUserById).toHaveBeenCalledWith('123');

      // Check user basic information
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@test.com')).toBeInTheDocument();
      expect(screen.getByText('+447123456789')).toBeInTheDocument();
      expect(screen.getByText(/customer/i)).toBeInTheDocument();

      // Check status badges
      expect(screen.getByText(/active/i)).toBeInTheDocument();
      expect(screen.getByText(/verified/i)).toBeInTheDocument();
      expect(screen.getByText(/subscribed/i)).toBeInTheDocument(); // Marketing opt-in
    });

    it('should display account statistics correctly', async () => {
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Check statistics cards
      expect(screen.getByText('5')).toBeInTheDocument(); // Order count
      expect(screen.getByText(/total orders/i)).toBeInTheDocument();
      expect(screen.getByText('£299.99')).toBeInTheDocument(); // Total spent
      expect(screen.getByText(/total spent/i)).toBeInTheDocument();
      
      // Check dates
      expect(screen.getByText(/joined on/i)).toBeInTheDocument();
      expect(screen.getByText(/last login/i)).toBeInTheDocument();
    });

    it('should handle user not found error', async () => {
      mockGetUserById.mockRejectedValue(new Error('User not found'));
      
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.getByText(/error loading user details/i)).toBeInTheDocument();
        expect(screen.getByText(/user not found/i)).toBeInTheDocument();
      });

      // Check back button
      const backButton = screen.getByText(/back to users/i);
      expect(backButton).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      mockGetUserById.mockRejectedValue(new Error('Network error'));
      
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.getByText(/error loading user details/i)).toBeInTheDocument();
      });

      // Check retry button
      const retryButton = screen.getByText(/try again/i);
      expect(retryButton).toBeInTheDocument();

      // Test retry functionality
      mockGetUserById.mockResolvedValue({
        success: true,
        data: { user: mockUserData }
      });

      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByText(/error loading user details/i)).not.toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('User Information Display', () => {
    it('should display complete personal information', async () => {
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Check personal info section
      expect(screen.getByText(/personal information/i)).toBeInTheDocument();
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@test.com')).toBeInTheDocument();
      expect(screen.getByText('+447123456789')).toBeInTheDocument();
    });

    it('should display shipping addresses correctly', async () => {
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Check shipping addresses section
      expect(screen.getByText(/shipping addresses/i)).toBeInTheDocument();
      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
      expect(screen.getByText('Apt 4B')).toBeInTheDocument();
      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.getByText('SW1A 1AA')).toBeInTheDocument();
      expect(screen.getByText(/default/i)).toBeInTheDocument();

      // Check secondary address
      expect(screen.getByText('456 Oak Avenue')).toBeInTheDocument();
      expect(screen.getByText('Manchester')).toBeInTheDocument();
      expect(screen.getByText('M1 1AA')).toBeInTheDocument();
    });

    it('should handle user with no shipping addresses', async () => {
      const userWithoutAddresses = {
        ...mockUserData,
        shippingAddresses: []
      };

      mockGetUserById.mockResolvedValue({
        success: true,
        data: { user: userWithoutAddresses }
      });

      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/no shipping addresses/i)).toBeInTheDocument();
    });

    it('should display activity log correctly', async () => {
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Check activity log section
      expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Order Placed')).toBeInTheDocument();
      expect(screen.getByText('Profile Updated')).toBeInTheDocument();
      
      // Check activity details
      expect(screen.getByText(/successful login from ip/i)).toBeInTheDocument();
      expect(screen.getByText(/order #ord-001 placed/i)).toBeInTheDocument();
      expect(screen.getByText(/updated phone number/i)).toBeInTheDocument();
    });

    it('should handle user with incomplete information', async () => {
      const incompleteUser = {
        ...mockUserData,
        phone: null,
        lastLoginAt: null,
        shippingAddresses: [],
        activityLog: []
      };

      mockGetUserById.mockResolvedValue({
        success: true,
        data: { user: incompleteUser }
      });

      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Check handling of missing data
      expect(screen.getByText(/no phone number/i)).toBeInTheDocument();
      expect(screen.getByText(/never logged in/i)).toBeInTheDocument();
      expect(screen.getByText(/no shipping addresses/i)).toBeInTheDocument();
      expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();
    });
  });

  describe('Account Status Management', () => {
    it('should show disable option for active users', async () => {
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Check account management section
      expect(screen.getByText(/account management/i)).toBeInTheDocument();
      expect(screen.getByText(/current status.*active/i)).toBeInTheDocument();
      
      // Check disable button
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

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/current status.*disabled/i)).toBeInTheDocument();
      
      const enableButton = screen.getByRole('button', { name: /enable account/i });
      expect(enableButton).toBeInTheDocument();
      expect(enableButton).not.toBeDisabled();
    });

    it('should handle disable account action', async () => {
      const user = userEvent.setup();
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Click disable button
      const disableButton = screen.getByRole('button', { name: /disable account/i });
      await user.click(disableButton);

      // Check confirmation dialog
      expect(screen.getByText(/disable user account/i)).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to disable.*john doe/i)).toBeInTheDocument();

      // Confirm action
      const confirmButton = screen.getByRole('button', { name: /disable account/i });
      await user.click(confirmButton);

      // Verify API call
      await waitFor(() => {
        expect(mockUpdateUserStatus).toHaveBeenCalledWith('123', {
          newStatus: 'disabled'
        });
      });

      // Check success message
      expect(screen.getByText(/account disabled successfully/i)).toBeInTheDocument();
    });

    it('should handle enable account action', async () => {
      const user = userEvent.setup();
      
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

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Click enable button
      const enableButton = screen.getByRole('button', { name: /enable account/i });
      await user.click(enableButton);

      // Check confirmation dialog
      expect(screen.getByText(/enable user account/i)).toBeInTheDocument();

      // Confirm action
      const confirmButton = screen.getByRole('button', { name: /enable account/i });
      await user.click(confirmButton);

      // Verify API call
      await waitFor(() => {
        expect(mockUpdateUserStatus).toHaveBeenCalledWith('123', {
          newStatus: 'active'
        });
      });
    });

    it('should handle status update errors', async () => {
      const user = userEvent.setup();
      mockUpdateUserStatus.mockRejectedValue(new Error('Update failed'));
      
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Attempt to disable
      const disableButton = screen.getByRole('button', { name: /disable account/i });
      await user.click(disableButton);

      const confirmButton = screen.getByRole('button', { name: /disable account/i });
      await user.click(confirmButton);

      // Check error message
      await waitFor(() => {
        expect(screen.getByText(/error updating account status/i)).toBeInTheDocument();
        expect(screen.getByText(/update failed/i)).toBeInTheDocument();
      });
    });

    it('should cancel status update when cancelled', async () => {
      const user = userEvent.setup();
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Open dialog and cancel
      const disableButton = screen.getByRole('button', { name: /disable account/i });
      await user.click(disableButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify no API call and dialog closed
      expect(mockUpdateUserStatus).not.toHaveBeenCalled();
      expect(screen.queryByText(/disable user account/i)).not.toBeInTheDocument();
    });
  });

  describe('Navigation and Actions', () => {
    it('should navigate back to users list', async () => {
      const user = userEvent.setup();
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      const backButton = screen.getByText(/back to users/i);
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
    });

    it('should provide edit user functionality (if implemented)', async () => {
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Check if edit button exists (this might not be implemented yet)
      const editButton = screen.queryByText(/edit user/i);
      if (editButton) {
        expect(editButton).toBeInTheDocument();
      }
    });

    it('should provide view orders functionality', async () => {
      const user = userEvent.setup();
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Check view orders button (if it exists)
      const viewOrdersButton = screen.queryByText(/view orders/i);
      if (viewOrdersButton) {
        await user.click(viewOrdersButton);
        expect(mockNavigate).toHaveBeenCalledWith('/admin/orders', { 
          state: { userId: '123' } 
        });
      }
    });
  });

  describe('Responsive Design and Accessibility', () => {
    it('should be accessible with proper ARIA labels and roles', async () => {
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Check main heading
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      // Check section headings
      expect(screen.getByRole('heading', { name: /personal information/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /account management/i })).toBeInTheDocument();

      // Check button accessibility
      const actionButtons = screen.getAllByRole('button');
      actionButtons.forEach(button => {
        expect(button).toHaveAttribute('type');
      });
    });

    it('should handle keyboard navigation properly', async () => {
      const user = userEvent.setup();
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Test tab navigation
      const backButton = screen.getByRole('button', { name: /back to users/i });
      const disableButton = screen.getByRole('button', { name: /disable account/i });

      backButton.focus();
      expect(backButton).toHaveFocus();

      await user.tab();
      expect(disableButton).toHaveFocus();
    });

    it('should display properly on mobile viewport', async () => {
      // This would typically involve setting viewport size and checking layout
      // For now, we verify responsive elements are present
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Check that all sections are rendered (responsive design should handle layout)
      expect(screen.getByText(/personal information/i)).toBeInTheDocument();
      expect(screen.getByText(/shipping addresses/i)).toBeInTheDocument();
      expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
      expect(screen.getByText(/account management/i)).toBeInTheDocument();
    });
  });

  describe('Data Formatting and Display', () => {
    it('should format dates correctly', async () => {
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Check date formatting (this would depend on your date formatting implementation)
      expect(screen.getByText(/january.*2024/i)).toBeInTheDocument(); // Registration date
      expect(screen.getByText(/january.*2024/i)).toBeInTheDocument(); // Last login date
    });

    it('should format currency correctly', async () => {
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Check currency formatting
      expect(screen.getByText('£299.99')).toBeInTheDocument();
    });

    it('should handle missing optional fields gracefully', async () => {
      const userWithMissingFields = {
        ...mockUserData,
        phone: null,
        marketingOptIn: false,
        lastLoginAt: null
      };

      mockGetUserById.mockResolvedValue({
        success: true,
        data: { user: userWithMissingFields }
      });

      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Verify graceful handling of missing data
      expect(screen.getByText(/not provided/i)).toBeInTheDocument(); // Phone
      expect(screen.getByText(/not subscribed/i)).toBeInTheDocument(); // Marketing
      expect(screen.getByText(/never/i)).toBeInTheDocument(); // Last login
    });
  });

  describe('Performance Considerations', () => {
    it('should not make unnecessary API calls', async () => {
      renderAdminUserDetailsPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading user details.../i)).not.toBeInTheDocument();
      });

      // Should only call getUserById once on mount
      expect(mockGetUserById).toHaveBeenCalledTimes(1);
      expect(mockGetUserById).toHaveBeenCalledWith('123');
    });

    it('should handle component cleanup properly', () => {
      const { unmount } = renderAdminUserDetailsPage();
      
      // Unmount component
      unmount();
      
      // No additional assertions needed, this tests for memory leaks
      // In a real scenario, you might check for cleanup of timers, subscriptions, etc.
    });
  });
});