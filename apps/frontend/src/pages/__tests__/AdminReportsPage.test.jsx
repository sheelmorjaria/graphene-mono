import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminReportsPage from '../AdminReportsPage';

// Mock the adminService
vi.mock('../../services/adminService', () => ({
  getSalesReport: vi.fn(),
  getProductPerformanceReport: vi.fn(),
  getCustomerReport: vi.fn(),
  getInventoryReport: vi.fn()
}));

// Mock the LoadingSpinner component
vi.mock('../../components/LoadingSpinner', () => ({
  default: () => <div>Loading...</div>
}));

import { getSalesReport, getProductPerformanceReport, getCustomerReport, getInventoryReport } from '../../services/adminService';

const mockSalesData = {
  totalRevenue: 25000,
  orderCount: 50,
  averageOrderValue: 500
};

const mockProductData = {
  topProducts: [
    { _id: '1', name: 'Pixel 7 Pro', quantitySold: 15, revenue: 12000 },
    { _id: '2', name: 'Pixel 7', quantitySold: 20, revenue: 10000 }
  ],
  lowStockProducts: [
    { _id: '3', name: 'Pixel 6a', sku: 'PIX6A', stockQuantity: 5 },
    { _id: '4', name: 'Pixel 6 Pro', sku: 'PIX6P', stockQuantity: 3 }
  ]
};

const mockCustomerData = {
  newCustomerCount: 25
};

const mockInventoryData = {
  inStockCount: 45,
  outOfStockCount: 5,
  lowStockCount: 8
};

const renderAdminReportsPage = () => {
  return render(
    <BrowserRouter>
      <AdminReportsPage />
    </BrowserRouter>
  );
};

describe('AdminReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful responses
    getSalesReport.mockResolvedValue(mockSalesData);
    getProductPerformanceReport.mockResolvedValue(mockProductData);
    getCustomerReport.mockResolvedValue(mockCustomerData);
    getInventoryReport.mockResolvedValue(mockInventoryData);
  });

  it('should render page title and date range picker', async () => {
    renderAdminReportsPage();
    
    await waitFor(() => {
      expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();
      const selectElement = screen.getByRole('combobox');
      expect(selectElement.value).toBe('monthly');
    });
  });

  it('should load and display all reports on mount', async () => {
    renderAdminReportsPage();
    
    await waitFor(() => {
      // Sales Summary
      expect(screen.getByText('Sales Summary')).toBeInTheDocument();
      expect(screen.getByText('£25,000.00')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('£500.00')).toBeInTheDocument();
      
      // Product Performance
      expect(screen.getByText('Product Performance')).toBeInTheDocument();
      expect(screen.getByText('Pixel 7 Pro')).toBeInTheDocument();
      expect(screen.getByText('Pixel 6a')).toBeInTheDocument();
      
      // Customer Report
      expect(screen.getByText('Customer Acquisition')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      
      // Inventory Summary
      expect(screen.getByText('Inventory Summary')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      
      // Check for inventory counts more specifically
      const inventorySection = screen.getByText('Inventory Summary').closest('.bg-white');
      expect(inventorySection).toHaveTextContent('45');
      expect(inventorySection).toHaveTextContent('5');
      expect(inventorySection).toHaveTextContent('8');
    });
  });

  it('should change date range and refetch reports', async () => {
    renderAdminReportsPage();
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    
    // Change to daily
    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: 'daily' } });
    
    await waitFor(() => {
      expect(adminService.getSalesReport).toHaveBeenCalledTimes(2);
      expect(adminService.getProductPerformanceReport).toHaveBeenCalledTimes(2);
      expect(adminService.getCustomerReport).toHaveBeenCalledTimes(2);
      expect(adminService.getInventoryReport).toHaveBeenCalledTimes(2);
    });
  });

  it('should show custom date inputs when custom range is selected', async () => {
    renderAdminReportsPage();
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    
    // Change to custom
    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: 'custom' } });
    
    // Wait for the date inputs to appear
    await waitFor(() => {
      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs.length).toBe(2);
    });
  });

  it('should display error message when reports fail to load', async () => {
    getSalesReport.mockRejectedValue(new Error('Network error'));
    
    renderAdminReportsPage();
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch reports')).toBeInTheDocument();
    });
  });

  it('should display loading state while fetching reports', async () => {
    renderAdminReportsPage();
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for loading to complete to avoid act warnings
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('should display best selling products table correctly', async () => {
    renderAdminReportsPage();
    
    await waitFor(() => {
      expect(screen.getByText('Best Selling Products')).toBeInTheDocument();
      
      // Find the best selling products section and check its content
      const bestSellingSection = screen.getByText('Best Selling Products').closest('div');
      expect(bestSellingSection).toHaveTextContent('Product');
      expect(bestSellingSection).toHaveTextContent('Quantity');
      expect(bestSellingSection).toHaveTextContent('Revenue');
      
      // Check product data
      expect(screen.getByText('Pixel 7 Pro')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('£12,000.00')).toBeInTheDocument();
    });
  });

  it('should display low stock products table correctly', async () => {
    renderAdminReportsPage();
    
    await waitFor(() => {
      expect(screen.getByText('Low Stock Products')).toBeInTheDocument();
      expect(screen.getByText('SKU')).toBeInTheDocument();
      expect(screen.getByText('Stock')).toBeInTheDocument();
      
      // Check low stock data
      expect(screen.getByText('Pixel 6a')).toBeInTheDocument();
      expect(screen.getByText('PIX6A')).toBeInTheDocument();
      
      // Check for stock quantity in the low stock table
      const lowStockSection = screen.getByText('Low Stock Products').closest('div');
      expect(lowStockSection).toHaveTextContent('5');
    });
  });
});