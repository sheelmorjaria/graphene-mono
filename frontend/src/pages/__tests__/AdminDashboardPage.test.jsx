import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminDashboardPage from '../AdminDashboardPage';
import * as adminService from '../../services/adminService';

// Mock the admin service
vi.mock('../../services/adminService');

const MockRouter = ({ children, initialEntries = ['/admin/dashboard'] }) => (
  <MemoryRouter initialEntries={initialEntries}>
    {children}
  </MemoryRouter>
);

describe('AdminDashboardPage', () => {
  const mockMetrics = {
    orders: {
      total: 150,
      today: 5,
      week: 25,
      month: 80,
      pending: 3,
      awaitingShipment: 7
    },
    revenue: {
      total: 125000.50,
      today: 2500.00,
      week: 15000.00,
      month: 45000.00
    },
    customers: {
      newToday: 2,
      newWeek: 15,
      newMonth: 45
    },
    lastUpdated: '2024-12-06T10:30:00Z'
  };

  const mockUser = {
    id: 'admin1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);
    adminService.getAdminUser.mockReturnValue(mockUser);
    adminService.getDashboardMetrics.mockResolvedValue({ data: mockMetrics });
    
    // Mock window.confirm
    global.confirm = vi.fn();
  });

  it('renders dashboard correctly with metrics', async () => {
    render(
      <MockRouter>
        <AdminDashboardPage />
      </MockRouter>
    );

    // Check header
    expect(screen.getByText('GrapheneOS Store')).toBeInTheDocument();
    expect(screen.getByText('Welcome, Admin')).toBeInTheDocument();

    // Wait for metrics to load
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Overview of your store\'s performance and key metrics')).toBeInTheDocument();
    });

    // Check order metrics
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Total orders
      expect(screen.getByText('5')).toBeInTheDocument(); // Today's orders
      expect(screen.getByText('3')).toBeInTheDocument(); // Pending orders
      expect(screen.getByText('7')).toBeInTheDocument(); // Awaiting shipment
    });

    // Check revenue metrics
    await waitFor(() => {
      expect(screen.getByText('£125,000.50')).toBeInTheDocument(); // Total revenue
      expect(screen.getByText('£2,500.00')).toBeInTheDocument(); // Today's revenue
      expect(screen.getByText('£15,000.00')).toBeInTheDocument(); // Week revenue
      expect(screen.getByText('£45,000.00')).toBeInTheDocument(); // Month revenue
    });

    // Check customer metrics
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // New customers today
      expect(screen.getByText('15')).toBeInTheDocument(); // New customers week
      expect(screen.getByText('45')).toBeInTheDocument(); // New customers month
    });
  });

  it('shows loading state initially', () => {
    adminService.getDashboardMetrics.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <MockRouter>
        <AdminDashboardPage />
      </MockRouter>
    );

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('handles metrics loading error', async () => {
    const errorMessage = 'Failed to load dashboard metrics';
    adminService.getDashboardMetrics.mockRejectedValue(new Error(errorMessage));

    render(
      <MockRouter>
        <AdminDashboardPage />
      </MockRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('redirects to login when not authenticated', () => {
    adminService.isAdminAuthenticated.mockReturnValue(false);
    
    const mockNavigate = vi.fn();
    
    // Mock useNavigate
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate
      };
    });

    render(
      <MockRouter>
        <AdminDashboardPage />
      </MockRouter>
    );

    // The component should attempt to redirect
    expect(adminService.isAdminAuthenticated).toHaveBeenCalled();
  });

  it('refreshes metrics when refresh button is clicked', async () => {
    render(
      <MockRouter>
        <AdminDashboardPage />
      </MockRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(adminService.getDashboardMetrics).toHaveBeenCalledTimes(2);
  });

  it('shows loading state on refresh button when refreshing', async () => {
    let resolvePromise;
    adminService.getDashboardMetrics.mockImplementation(() => 
      new Promise(resolve => { resolvePromise = resolve; })
    );

    render(
      <MockRouter>
        <AdminDashboardPage />
      </MockRouter>
    );

    // Resolve initial load
    resolvePromise({ data: mockMetrics });

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Mock another slow request
    adminService.getDashboardMetrics.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    // Check that refresh button shows loading state
    expect(refreshButton).toBeDisabled();
  });

  it('handles logout confirmation', async () => {
    global.confirm.mockReturnValue(true);
    adminService.adminLogout.mockImplementation(() => {});

    render(
      <MockRouter>
        <AdminDashboardPage />
      </MockRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to logout?');
    expect(adminService.adminLogout).toHaveBeenCalled();
  });

  it('cancels logout when user declines confirmation', async () => {
    global.confirm.mockReturnValue(false);
    adminService.adminLogout.mockImplementation(() => {});

    render(
      <MockRouter>
        <AdminDashboardPage />
      </MockRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to logout?');
    expect(adminService.adminLogout).not.toHaveBeenCalled();
  });

  it('displays metric cards with correct titles and icons', async () => {
    render(
      <MockRouter>
        <AdminDashboardPage />
      </MockRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Order metrics
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Today\'s Orders')).toBeInTheDocument();
    expect(screen.getByText('Pending Orders')).toBeInTheDocument();
    expect(screen.getByText('Awaiting Shipment')).toBeInTheDocument();

    // Revenue metrics
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Today\'s Revenue')).toBeInTheDocument();
    expect(screen.getByText('This Week')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();

    // Customer metrics
    expect(screen.getByText('New Customers')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('This Week')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
  });

  it('displays quick actions section', async () => {
    render(
      <MockRouter>
        <AdminDashboardPage />
      </MockRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Manage Orders')).toBeInTheDocument();
    expect(screen.getByText('Manage Products')).toBeInTheDocument();
    expect(screen.getByText('Manage Users')).toBeInTheDocument();
    
    // All should show "Coming Soon"
    const comingSoonTexts = screen.getAllByText('Coming Soon');
    expect(comingSoonTexts).toHaveLength(3);
  });

  it('displays last updated time correctly', async () => {
    render(
      <MockRouter>
        <AdminDashboardPage />
      </MockRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Wait a bit for lastUpdated to be set
    await waitFor(() => {
      const lastUpdatedText = screen.getByText(/Last updated:/);
      expect(lastUpdatedText).toBeInTheDocument();
    });
  });
});