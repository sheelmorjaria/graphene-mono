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
const { mockGetAllUsers, mockUpdateUserStatus } = vi.hoisted(() => ({
  mockGetAllUsers: vi.fn(),
  mockUpdateUserStatus: vi.fn()
}));

vi.mock('../../services/adminService', () => ({
  getAllUsers: mockGetAllUsers,
  updateUserStatus: mockUpdateUserStatus,
  default: {
    getAllUsers: mockGetAllUsers,
    updateUserStatus: mockUpdateUserStatus
  }
}));

// Mock components
vi.mock('../../components/Pagination', () => ({
  default: ({ onPageChange, currentPage, totalPages }) => (
    <div data-testid="pagination">
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next Page
      </button>
      <span>Page {currentPage} of {totalPages}</span>
    </div>
  )
}));

vi.mock('../../components/LoadingSpinner', () => ({
  default: () => <div aria-label="Loading">Loading...</div>
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

  const waitForLoaded = () =>
    waitFor(() => {
      expect(screen.queryByLabelText(/loading/i)).not.toBeInTheDocument();
    });

  describe('Initial Rendering and Data Loading', () => {
    it('should render page structure and load users on mount', async () => {
      renderAdminUsersListPage();

      // Shows loading spinner first
      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();

      await waitForLoaded();

      // Verify API was called with default parameters
      expect(mockGetAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
      );

      // Verify users are displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should display user information correctly in table format', async () => {
      renderAdminUsersListPage();

      await waitForLoaded();

      // Check table headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Registration Date')).toBeInTheDocument();
      expect(screen.getByText('Last Login')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();

      // Check user data display
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@test.com')).toBeInTheDocument();

      // Check status badges
      const activeStatus = screen.getAllByText(/active/i);
      const disabledStatus = screen.getAllByText(/disabled/i);
      expect(activeStatus.length).toBeGreaterThan(0);
      expect(disabledStatus.length).toBeGreaterThan(0);
    });

    it('should show total user count in header', async () => {
      renderAdminUsersListPage();

      await waitForLoaded();

      expect(screen.getByText(/25 total users/i)).toBeInTheDocument();
    });

    it('should handle loading errors gracefully', async () => {
      mockGetAllUsers.mockRejectedValue(new Error('Failed to fetch users'));

      renderAdminUsersListPage();

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch users/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering Functionality', () => {
    it('should handle search by name or email (debounced)', async () => {
      renderAdminUsersListPage();

      await waitForLoaded();

      const searchInput = screen.getByPlaceholderText(/search by name or email/i);
      await userEvent.type(searchInput, 'John Doe');

      await waitFor(() => {
        expect(mockGetAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            searchQuery: 'John Doe'
          })
        );
      }, { timeout: 2000 });
    });

    it('should handle account status filtering', async () => {
      renderAdminUsersListPage();

      await waitForLoaded();

      const statusFilter = screen.getByRole('combobox');
      await userEvent.selectOptions(statusFilter, 'disabled');

      await waitFor(() => {
        expect(mockGetAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            accountStatus: 'disabled'
          })
        );
      });
    });

    it('should handle date range filtering', async () => {
      renderAdminUsersListPage();

      await waitForLoaded();

      const startDateInput = screen.getByPlaceholderText('Start Date');
      const endDateInput = screen.getByPlaceholderText('End Date');

      await userEvent.type(startDateInput, '2024-01-01');
      await userEvent.type(endDateInput, '2024-01-31');

      await waitFor(() => {
        expect(mockGetAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          })
        );
      });
    });

    it('should clear all filters when reset button is clicked', async () => {
      renderAdminUsersListPage();

      await waitForLoaded();

      // Apply some filters
      const searchInput = screen.getByPlaceholderText(/search by name or email/i);
      const statusFilter = screen.getByRole('combobox');

      await userEvent.type(searchInput, 'test search');
      await userEvent.selectOptions(statusFilter, 'disabled');

      // Clear filters
      const clearButton = screen.getByText(/clear filters/i);
      await userEvent.click(clearButton);

      // Verify filters are cleared
      expect(searchInput.value).toBe('');
      expect(statusFilter.value).toBe('');
    });
  });

  describe('Sorting Functionality', () => {
    it('should handle sorting by clicking Name column header', async () => {
      renderAdminUsersListPage();

      await waitForLoaded();

      const nameHeader = screen.getByText('Name');
      await userEvent.click(nameHeader);

      await waitFor(() => {
        expect(mockGetAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'firstName'
          })
        );
      });
    });

    it('should toggle sort order when clicking a sorted column header', async () => {
      renderAdminUsersListPage();

      await waitForLoaded();

      // Click Registration Date header (default sort is createdAt/desc)
      const regHeader = screen.getByText('Registration Date');
      await userEvent.click(regHeader);

      await waitFor(() => {
        expect(mockGetAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'createdAt',
            sortOrder: 'asc'
          })
        );
      });
    });
  });

  describe('User Status Management', () => {
    it('should show disable confirmation dialog for active users', async () => {
      renderAdminUsersListPage();

      await waitForLoaded();

      // Click disable button for active user (John Doe - first active)
      const disableButtons = screen.getAllByRole('button', { name: 'Disable' });
      await userEvent.click(disableButtons[0]);

      // Check confirmation dialog
      expect(screen.getByText(/disable user account/i)).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to disable/i)).toBeInTheDocument();

      // Check dialog buttons
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /disable account/i })).toBeInTheDocument();
    });

    it('should successfully disable user account', async () => {
      renderAdminUsersListPage();

      await waitForLoaded();

      // Click disable button and confirm
      const disableButtons = screen.getAllByRole('button', { name: 'Disable' });
      await userEvent.click(disableButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /disable account/i });
      await userEvent.click(confirmButton);

      // Verify API call
      await waitFor(() => {
        expect(mockUpdateUserStatus).toHaveBeenCalledWith('1', {
          newStatus: 'disabled'
        });
      });

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/user account disabled successfully/i)).toBeInTheDocument();
      });
    });

    it('should show enable confirmation dialog for disabled users', async () => {
      renderAdminUsersListPage();

      await waitForLoaded();

      // Click enable button for disabled user (Jane Smith)
      const enableButton = screen.getByRole('button', { name: 'Enable' });
      await userEvent.click(enableButton);

      // Check confirmation dialog
      expect(screen.getByText(/enable user account/i)).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to enable/i)).toBeInTheDocument();
    });

    it('should handle status update errors', async () => {
      mockUpdateUserStatus.mockRejectedValue(new Error('Status update failed'));

      renderAdminUsersListPage();

      await waitForLoaded();

      // Attempt to disable user
      const disableButtons = screen.getAllByRole('button', { name: 'Disable' });
      await userEvent.click(disableButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /disable account/i });
      await userEvent.click(confirmButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/status update failed/i)).toBeInTheDocument();
      });
    });

    it('should cancel status update when cancel button is clicked', async () => {
      renderAdminUsersListPage();

      await waitForLoaded();

      // Click disable button
      const disableButtons = screen.getAllByRole('button', { name: 'Disable' });
      await userEvent.click(disableButtons[0]);

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      // Verify dialog is closed and no API call was made
      expect(screen.queryByText(/disable user account/i)).not.toBeInTheDocument();
      expect(mockUpdateUserStatus).not.toHaveBeenCalled();
    });
  });

  describe('Navigation and Pagination', () => {
    it('should navigate to user details when view button is clicked', async () => {
      renderAdminUsersListPage();

      await waitForLoaded();

      // View Details is a <Link>; first one points to user 1
      const viewLinks = screen.getAllByText('View Details');
      const firstLink = viewLinks[0].closest('a');
      expect(firstLink).toHaveAttribute('href', '/admin/users/1');
    });

    it('should handle pagination correctly', async () => {
      renderAdminUsersListPage();

      await waitForLoaded();

      // Click next page
      const nextPageButton = screen.getByText('Next Page');
      await userEvent.click(nextPageButton);

      await waitFor(() => {
        expect(mockGetAllUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2
          })
        );
      });
    });
  });

  describe('Responsive Design and Accessibility', () => {
    it('should be accessible with proper structure', async () => {
      renderAdminUsersListPage();

      await waitForLoaded();

      // Check main heading
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      // Check table accessibility
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Check form controls exist
      expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
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
        expect(screen.getByText(/no users found matching your criteria/i)).toBeInTheDocument();
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

      await waitForLoaded();

      // Verify long text is displayed
      expect(screen.getByText(/VeryLongFirstNameThatExceedsNormalLength/)).toBeInTheDocument();
      expect(screen.getByText(/very.long.email.address/)).toBeInTheDocument();
    });
  });
});
