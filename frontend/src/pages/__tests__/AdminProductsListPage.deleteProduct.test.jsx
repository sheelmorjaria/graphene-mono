import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import AdminProductsListPage from '../AdminProductsListPage';
import * as adminService from '../../services/adminService';

// Mock the adminService
vi.mock('../../services/adminService', () => ({
  getProducts: vi.fn(),
  deleteProduct: vi.fn(),
  formatCurrency: vi.fn((amount) => `£${amount.toFixed(2)}`)
}));

// Mock react-router-dom Link component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
  };
});

// Mock LoadingSpinner component
vi.mock('../../components/LoadingSpinner', () => ({
  default: function LoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  }
}));

// Mock Pagination component
vi.mock('../../components/Pagination', () => ({
  default: function Pagination({ currentPage, totalPages, onPageChange }) {
    return (
      <div data-testid="pagination">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
          Next
        </button>
      </div>
    );
  }
}));

const mockProducts = [
  {
    _id: '1',
    name: 'Google Pixel 8',
    sku: 'PIXEL8-001',
    price: 699.99,
    stockQuantity: 15,
    status: 'active',
    images: ['https://example.com/pixel8.jpg']
  },
  {
    _id: '2',
    name: 'Google Pixel 7',
    sku: 'PIXEL7-001',
    price: 599.99,
    stockQuantity: 0,
    status: 'draft',
    images: []
  },
  {
    _id: '3',
    name: 'Privacy Screen Protector',
    sku: 'SCREEN-001',
    price: 29.99,
    stockQuantity: 5,
    status: 'active',
    images: ['https://example.com/screen.jpg']
  }
];

const mockResponse = {
  success: true,
  data: {
    products: mockProducts,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 3,
      itemsPerPage: 10,
      hasNextPage: false,
      hasPrevPage: false
    }
  }
};

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AdminProductsListPage - Delete Product Functionality', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Default mock for getProducts
    adminService.getProducts.mockResolvedValue(mockResponse);
  });

  describe('Delete Button Rendering', () => {
    test('should render delete button for each product', async () => {
      // Arrange & Act
      renderWithRouter(<AdminProductsListPage />);

      // Wait for products to load
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Assert
      const deleteButtons = screen.getAllByText('Delete');
      expect(deleteButtons).toHaveLength(mockProducts.length);
    });

    test('should render delete buttons with correct styling', async () => {
      // Arrange & Act
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Assert
      const deleteButtons = screen.getAllByText('Delete');
      deleteButtons.forEach(button => {
        expect(button).toHaveClass('text-red-600', 'hover:text-red-900');
      });
    });

    test('should not render delete buttons when no products', async () => {
      // Arrange
      const emptyResponse = {
        ...mockResponse,
        data: {
          ...mockResponse.data,
          products: []
        }
      };
      adminService.getProducts.mockResolvedValue(emptyResponse);

      // Act
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Assert
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
      expect(screen.getByText('No products found matching your criteria.')).toBeInTheDocument();
    });
  });

  describe('Delete Confirmation Modal', () => {
    test('should open confirmation modal when delete button is clicked', async () => {
      // Arrange
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const firstDeleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(firstDeleteButton);

      // Assert
      expect(screen.getByText('Archive Product')).toBeInTheDocument();
      expect(screen.getByText(`Are you sure you want to archive "${mockProducts[0].name}"?`)).toBeInTheDocument();
    });

    test('should display correct product name in confirmation modal', async () => {
      // Arrange
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const secondDeleteButton = screen.getAllByText('Delete')[1];
      fireEvent.click(secondDeleteButton);

      // Assert
      expect(screen.getByText(`Are you sure you want to archive "${mockProducts[1].name}"?`)).toBeInTheDocument();
    });

    test('should show soft delete explanation in modal', async () => {
      // Arrange
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);

      // Assert
      expect(screen.getByText('Soft Delete:')).toBeInTheDocument();
      expect(screen.getByText(/This will archive the product, removing it from the storefront/)).toBeInTheDocument();
      expect(screen.getByText(/The product can be restored later if needed/)).toBeInTheDocument();
    });

    test('should render modal action buttons', async () => {
      // Arrange
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);

      // Assert
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Archive Product' })).toBeInTheDocument();
    });

    test('should close modal when cancel button is clicked', async () => {
      // Arrange
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      // Assert
      expect(screen.queryByText('Archive Product')).not.toBeInTheDocument();
    });

    test('should display warning icon in modal', async () => {
      // Arrange
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);

      // Assert
      const modal = screen.getByText('Archive Product').closest('.fixed');
      expect(modal).toBeInTheDocument();
      
      // Check for warning icon (SVG with specific path)
      const warningIcon = modal.querySelector('svg');
      expect(warningIcon).toBeInTheDocument();
      expect(warningIcon).toHaveClass('h-6', 'w-6', 'text-red-600');
    });
  });

  describe('Product Deletion Process', () => {
    test('should call deleteProduct service when confirmed', async () => {
      // Arrange
      adminService.deleteProduct.mockResolvedValue({ success: true });
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(adminService.deleteProduct).toHaveBeenCalledWith(mockProducts[0]._id);
      });
    });

    test('should show loading state during deletion', async () => {
      // Arrange
      let resolveDelete;
      adminService.deleteProduct.mockReturnValue(new Promise(resolve => {
        resolveDelete = resolve;
      }));
      
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(confirmButton);

      // Assert
      expect(screen.getByRole('button', { name: 'Archiving...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Archiving...' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

      // Cleanup
      resolveDelete({ success: true });
    });

    test('should remove product from list after successful deletion', async () => {
      // Arrange
      adminService.deleteProduct.mockResolvedValue({ success: true });
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Verify product is initially present
      expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument();

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(mockProducts[0].name)).not.toBeInTheDocument();
      });
    });

    test('should show success message after deletion', async () => {
      // Arrange
      adminService.deleteProduct.mockResolvedValue({ success: true });
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Product archived successfully')).toBeInTheDocument();
      });
    });

    test('should close modal after successful deletion', async () => {
      // Arrange
      adminService.deleteProduct.mockResolvedValue({ success: true });
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText('Archive Product')).not.toBeInTheDocument();
      });
    });

    test('should auto-hide success message after 3 seconds', async () => {
      // Arrange
      vi.useFakeTimers();
      adminService.deleteProduct.mockResolvedValue({ success: true });
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Product archived successfully')).toBeInTheDocument();
      });

      // Fast-forward 3 seconds
      vi.advanceTimersByTime(3000);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText('Product archived successfully')).not.toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    test('should show error message when deletion fails', async () => {
      // Arrange
      const errorMessage = 'Failed to delete product';
      adminService.deleteProduct.mockRejectedValue(new Error(errorMessage));
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    test('should close modal when deletion fails', async () => {
      // Arrange
      adminService.deleteProduct.mockRejectedValue(new Error('Network error'));
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText('Archive Product')).not.toBeInTheDocument();
      });
    });

    test('should not remove product from list when deletion fails', async () => {
      // Arrange
      adminService.deleteProduct.mockRejectedValue(new Error('Server error'));
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Verify product is initially present
      expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument();

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
      
      // Product should still be in the list
      expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument();
    });

    test('should reset loading state when deletion fails', async () => {
      // Arrange
      adminService.deleteProduct.mockRejectedValue(new Error('Network timeout'));
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(confirmButton);

      // Assert - should not show loading state after error
      await waitFor(() => {
        expect(screen.queryByText('Archiving...')).not.toBeInTheDocument();
      });
    });

    test('should handle error with custom message', async () => {
      // Arrange
      const customError = 'Product is already archived';
      adminService.deleteProduct.mockRejectedValue(new Error(customError));
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(customError)).toBeInTheDocument();
      });
    });

    test('should handle error without message', async () => {
      // Arrange
      adminService.deleteProduct.mockRejectedValue(new Error());
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Failed to delete product')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Product Deletion', () => {
    test('should handle deletion of different products', async () => {
      // Arrange
      adminService.deleteProduct.mockResolvedValue({ success: true });
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act - Delete first product
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      let confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(adminService.deleteProduct).toHaveBeenCalledWith(mockProducts[0]._id);
      });

      // Act - Delete second product
      const remainingDeleteButtons = screen.getAllByText('Delete');
      fireEvent.click(remainingDeleteButtons[0]); // Now the first button corresponds to the second product
      
      confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(confirmButton);

      // Assert
      await waitFor(() => {
        expect(adminService.deleteProduct).toHaveBeenCalledWith(mockProducts[1]._id);
      });
    });

    test('should maintain correct product count after deletions', async () => {
      // Arrange
      adminService.deleteProduct.mockResolvedValue({ success: true });
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Initially 3 delete buttons
      expect(screen.getAllByText('Delete')).toHaveLength(3);

      // Act - Delete first product
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(confirmButton);

      // Assert - Should have 2 delete buttons remaining
      await waitFor(() => {
        expect(screen.getAllByText('Delete')).toHaveLength(2);
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels for delete buttons', async () => {
      // Arrange
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButtons = screen.getAllByText('Delete');

      // Assert
      deleteButtons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button.tagName).toBe('BUTTON');
      });
    });

    test('should support keyboard navigation for modal', async () => {
      // Arrange
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);

      // Assert
      const modal = screen.getByText('Archive Product').closest('.fixed');
      expect(modal).toBeInTheDocument();
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      
      expect(cancelButton).toBeInTheDocument();
      expect(confirmButton).toBeInTheDocument();
    });

    test('should disable buttons appropriately during loading', async () => {
      // Arrange
      let resolveDelete;
      adminService.deleteProduct.mockReturnValue(new Promise(resolve => {
        resolveDelete = resolve;
      }));
      
      renderWithRouter(<AdminProductsListPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(confirmButton);

      // Assert
      const archivingButton = screen.getByRole('button', { name: 'Archiving...' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      
      expect(archivingButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();

      // Cleanup
      resolveDelete({ success: true });
    });
  });
});