import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import AdminUsersListPage from '../AdminUsersListPage';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock admin service
const mockGetAllUsers = vi.fn();
const mockUpdateUserStatus = vi.fn();

vi.mock('../../services/adminService', () => ({
  default: {
    getAllUsers: mockGetAllUsers,
    updateUserStatus: mockUpdateUserStatus
  }
}));

// Mock components
vi.mock('../../components/Pagination', () => ({
  default: ({ onPageChange, pagination }) => (
    <div data-testid="pagination">
      <button 
        onClick={() => onPageChange(pagination.currentPage + 1)}
        disabled={!pagination.hasNextPage}
      >
        Next Page
      </button>
      <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
    </div>
  )
}));

const mockUsers = [
  {
    _id: '1',
    email: 'john.doe@test.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'customer',
    accountStatus: 'active',
    emailVerified: true,
    createdAt: '2024-01-15T10:00:00Z',
    lastLoginAt: '2024-01-20T14:30:00Z',
    orderCount: 5,
    totalSpent: 299.99
  },
  {
    _id: '2',
    email: 'jane.smith@test.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'customer',
    accountStatus: 'disabled',
    emailVerified: true,
    createdAt: '2024-01-10T09:00:00Z',
    lastLoginAt: '2024-01-18T11:15:00Z',
    orderCount: 2,
    totalSpent: 149.50
  },
  {
    _id: '3',
    email: 'bob.johnson@test.com',
    firstName: 'Bob',
    lastName: 'Johnson',
    role: 'customer',
    accountStatus: 'active',
    emailVerified: false,
    createdAt: '2024-01-05T16:45:00Z',
    lastLoginAt: null,
    orderCount: 0,
    totalSpent: 0
  }
];

const mockPagination = {
  currentPage: 1,
  totalPages: 2,
  totalUsers: 25,
  hasNextPage: true,
  hasPrevPage: false
};

const renderAdminUsersListPage = () => {
  return render(
    <MemoryRouter>
      <AdminUsersListPage />
    </MemoryRouter>
  );
};

describe('AdminUsersListPage - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful response
    mockGetAllUsers.mockResolvedValue({
      success: true,
      data: {
        users: mockUsers,
        pagination: mockPagination
      }
    });
    
    mockUpdateUserStatus.mockResolvedValue({
      success: true,
      data: {
        user: { ...mockUsers[0], accountStatus: 'disabled' }
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Rendering and Data Loading', () => {
    it('should render page structure and load users on mount', async () => {
      renderAdminUsersListPage();

      // Check page title and structure
      expect(screen.getByRole('heading', { name: /manage users/i })).toBeInTheDocument();
      expect(screen.getByText(/search and manage customer accounts/i)).toBeInTheDocument();

      // Check loading state
      expect(screen.getByText(/loading users.../i)).toBeInTheDocument();

      // Wait for users to load
      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      // Verify API was called with default parameters
      expect(mockGetAllUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // Verify users are displayed
      expect(screen.getByText('john.doe@test.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should display user information correctly in table format', async () => {
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      // Check table headers
      expect(screen.getByText('User Details')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Activity')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();

      // Check user data display
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@test.com')).toBeInTheDocument();
      expect(screen.getByText('5 orders')).toBeInTheDocument();
      expect(screen.getByText('£299.99 spent')).toBeInTheDocument();

      // Check status badges
      const activeStatus = screen.getAllByText(/active/i);
      const disabledStatus = screen.getAllByText(/disabled/i);
      expect(activeStatus.length).toBeGreaterThan(0);
      expect(disabledStatus.length).toBeGreaterThan(0);
    });

    it('should handle loading errors gracefully', async () => {
      mockGetAllUsers.mockRejectedValue(new Error('Failed to fetch users'));
      
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.getByText(/error loading users/i)).toBeInTheDocument();
        expect(screen.getByText(/failed to fetch users/i)).toBeInTheDocument();
      });

      // Check retry button
      const retryButton = screen.getByText(/try again/i);
      expect(retryButton).toBeInTheDocument();

      // Test retry functionality
      mockGetAllUsers.mockResolvedValue({
        success: true,
        data: { users: mockUsers, pagination: mockPagination }
      });

      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByText(/error loading users/i)).not.toBeInTheDocument();
        expect(screen.getByText('john.doe@test.com')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering Functionality', () => {
    it('should handle search by name', async () => {
      const user = userEvent.setup();
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      // Find and use search input
      const searchInput = screen.getByPlaceholderText(/search by name or email/i);
      await user.type(searchInput, 'John Doe');

      // Wait for debounced search
      await waitFor(() => {
        expect(mockGetAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'John Doe',
            searchField: 'name'
          })
        );
      }, { timeout: 1000 });
    });

    it('should handle search by email', async () => {
      const user = userEvent.setup();
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by name or email/i);
      await user.type(searchInput, 'john.doe@test.com');

      await waitFor(() => {
        expect(mockGetAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'john.doe@test.com',
            searchField: 'email'
          })
        );
      }, { timeout: 1000 });
    });

    it('should handle account status filtering', async () => {
      const user = userEvent.setup();
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      // Find and use status filter
      const statusFilter = screen.getByRole('combobox', { name: /account status/i });
      await user.selectOptions(statusFilter, 'disabled');

      await waitFor(() => {
        expect(mockGetAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            accountStatus: 'disabled'
          })
        );
      });
    });

    it('should handle email verification filtering', async () => {
      const user = userEvent.setup();
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      const verificationFilter = screen.getByRole('combobox', { name: /email verified/i });
      await user.selectOptions(verificationFilter, 'false');

      await waitFor(() => {
        expect(mockGetAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            emailVerified: 'false'
          })
        );
      });
    });

    it('should handle date range filtering', async () => {
      const user = userEvent.setup();
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      const fromDateInput = screen.getByLabelText(/from date/i);
      const toDateInput = screen.getByLabelText(/to date/i);

      await user.type(fromDateInput, '2024-01-01');
      await user.type(toDateInput, '2024-01-31');

      await waitFor(() => {
        expect(mockGetAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            registrationDateFrom: expect.stringContaining('2024-01-01'),
            registrationDateTo: expect.stringContaining('2024-01-31')
          })
        );
      });
    });

    it('should clear all filters when reset button is clicked', async () => {
      const user = userEvent.setup();
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      // Apply some filters
      const searchInput = screen.getByPlaceholderText(/search by name or email/i);
      const statusFilter = screen.getByRole('combobox', { name: /account status/i });

      await user.type(searchInput, 'test search');
      await user.selectOptions(statusFilter, 'disabled');

      // Clear filters
      const clearButton = screen.getByText(/clear filters/i);
      await user.click(clearButton);

      // Verify filters are cleared
      expect(searchInput.value).toBe('');
      expect(statusFilter.value).toBe('');

      await waitFor(() => {
        expect(mockGetAllUsers).toHaveBeenCalledWith({
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
      });
    });
  });

  describe('Sorting Functionality', () => {
    it('should handle sorting by different fields', async () => {
      const user = userEvent.setup();
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      const sortBySelect = screen.getByRole('combobox', { name: /sort by/i });
      await user.selectOptions(sortBySelect, 'firstName');

      await waitFor(() => {
        expect(mockGetAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'firstName',
            sortOrder: 'desc'
          })
        );
      });
    });

    it('should toggle sort order when clicking sort direction button', async () => {
      const user = userEvent.setup();
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      const sortOrderButton = screen.getByRole('button', { name: /sort order/i });
      await user.click(sortOrderButton);

      await waitFor(() => {
        expect(mockGetAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            sortOrder: 'asc'
          })
        );
      });
    });
  });

  describe('User Status Management', () => {
    it('should show disable confirmation dialog for active users', async () => {
      const user = userEvent.setup();
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      // Click disable button for active user (John Doe)
      const disableButtons = screen.getAllByText(/disable/i);
      await user.click(disableButtons[0]);

      // Check confirmation dialog
      expect(screen.getByText(/disable user account/i)).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to disable/i)).toBeInTheDocument();
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      
      // Check dialog buttons
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /disable account/i })).toBeInTheDocument();
    });

    it('should successfully disable user account', async () => {
      const user = userEvent.setup();
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      // Click disable button and confirm
      const disableButtons = screen.getAllByText(/disable/i);
      await user.click(disableButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /disable account/i });
      await user.click(confirmButton);

      // Verify API call
      await waitFor(() => {
        expect(mockUpdateUserStatus).toHaveBeenCalledWith('1', {
          newStatus: 'disabled'
        });
      });

      // Verify success message
      expect(screen.getByText(/user account disabled successfully/i)).toBeInTheDocument();

      // Verify page refresh
      expect(mockGetAllUsers).toHaveBeenCalledTimes(2); // Initial load + refresh after status change
    });

    it('should show enable confirmation dialog for disabled users', async () => {
      const user = userEvent.setup();
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      // Click enable button for disabled user (Jane Smith)
      const enableButtons = screen.getAllByText(/enable/i);
      await user.click(enableButtons[0]);

      // Check confirmation dialog
      expect(screen.getByText(/enable user account/i)).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to enable/i)).toBeInTheDocument();
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
    });

    it('should handle status update errors', async () => {
      const user = userEvent.setup();
      mockUpdateUserStatus.mockRejectedValue(new Error('Status update failed'));
      
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      // Attempt to disable user
      const disableButtons = screen.getAllByText(/disable/i);
      await user.click(disableButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /disable account/i });
      await user.click(confirmButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/error updating user status/i)).toBeInTheDocument();
        expect(screen.getByText(/status update failed/i)).toBeInTheDocument();
      });
    });

    it('should cancel status update when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      // Click disable button
      const disableButtons = screen.getAllByText(/disable/i);
      await user.click(disableButtons[0]);

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify dialog is closed and no API call was made
      expect(screen.queryByText(/disable user account/i)).not.toBeInTheDocument();
      expect(mockUpdateUserStatus).not.toHaveBeenCalled();
    });
  });

  describe('Navigation and Pagination', () => {
    it('should navigate to user details when view button is clicked', async () => {
      const user = userEvent.setup();
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText(/view/i);
      await user.click(viewButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/users/1');
    });

    it('should handle pagination correctly', async () => {
      const user = userEvent.setup();
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      // Click next page
      const nextPageButton = screen.getByText('Next Page');
      await user.click(nextPageButton);

      await waitFor(() => {
        expect(mockGetAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2
          })
        );
      });
    });

    it('should handle page size changes', async () => {
      const user = userEvent.setup();
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      const pageSizeSelect = screen.getByRole('combobox', { name: /users per page/i });
      await user.selectOptions(pageSizeSelect, '25');

      await waitFor(() => {
        expect(mockGetAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 25,
            page: 1 // Should reset to page 1 when changing page size
          })
        );
      });
    });
  });

  describe('Responsive Design and Accessibility', () => {
    it('should be accessible with proper ARIA labels', async () => {
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      // Check main heading
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      // Check table accessibility
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Check form controls have labels
      const searchInput = screen.getByRole('textbox', { name: /search users/i });
      expect(searchInput).toBeInTheDocument();

      const statusFilter = screen.getByRole('combobox', { name: /account status/i });
      expect(statusFilter).toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      // Test tab navigation through interactive elements
      const searchInput = screen.getByRole('textbox', { name: /search users/i });
      searchInput.focus();
      
      await user.tab();
      expect(screen.getByRole('combobox', { name: /account status/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('combobox', { name: /email verified/i })).toHaveFocus();
    });
  });

  describe('Empty States and Edge Cases', () => {
    it('should show empty state when no users found', async () => {
      mockGetAllUsers.mockResolvedValue({
        success: true,
        data: {
          users: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalUsers: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });

      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.getByText(/no users found/i)).toBeInTheDocument();
        expect(screen.getByText(/try adjusting your search criteria/i)).toBeInTheDocument();
      });
    });

    it('should show appropriate message for search with no results', async () => {
      const user = userEvent.setup();
      
      // Initial load with users
      renderAdminUsersListPage();
      
      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      // Mock empty search results
      mockGetAllUsers.mockResolvedValue({
        success: true,
        data: {
          users: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalUsers: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });

      // Perform search
      const searchInput = screen.getByPlaceholderText(/search by name or email/i);
      await user.type(searchInput, 'nonexistent user');

      await waitFor(() => {
        expect(screen.getByText(/no users found matching your search/i)).toBeInTheDocument();
      });
    });

    it('should handle very long user names and emails gracefully', async () => {
      const longNameUser = {
        ...mockUsers[0],
        firstName: 'VeryLongFirstNameThatExceedsNormalLength',
        lastName: 'VeryLongLastNameThatAlsoExceedsNormalLength',
        email: 'very.long.email.address.that.exceeds.normal.length@example.com'
      };

      mockGetAllUsers.mockResolvedValue({
        success: true,
        data: {
          users: [longNameUser],
          pagination: mockPagination
        }
      });

      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.queryByText(/loading users.../i)).not.toBeInTheDocument();
      });

      // Verify long text is displayed (may be truncated with CSS)
      expect(screen.getByText(/VeryLongFirstNameThatExceedsNormalLength/)).toBeInTheDocument();
      expect(screen.getByText(/very.long.email.address/)).toBeInTheDocument();
    });
  });
});