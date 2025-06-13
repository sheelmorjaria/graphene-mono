import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import AdminProductFormPage from '../AdminProductFormPage';
import * as adminService from '../../services/adminService';

// Mock the adminService
vi.mock('../../services/adminService', () => ({
  getProductById: vi.fn(),
  updateProduct: vi.fn(),
  createProduct: vi.fn(),
  deleteProduct: vi.fn()
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ productId: 'test-product-id' })
  };
});

// Mock LoadingSpinner component
vi.mock('../../components/LoadingSpinner', () => {
  return function LoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

const mockProduct = {
  _id: 'test-product-id',
  name: 'Google Pixel 8',
  sku: 'PIXEL8-001',
  shortDescription: 'Latest Google Pixel smartphone',
  longDescription: 'The Google Pixel 8 with GrapheneOS pre-installed',
  price: 699.99,
  salePrice: 649.99,
  stockQuantity: 15,
  lowStockThreshold: 5,
  category: {
    _id: 'category-id',
    name: 'Smartphones'
  },
  tags: ['smartphone', 'google', 'pixel'],
  status: 'active',
  condition: 'new',
  stockStatus: 'in_stock',
  images: [
    { url: '/uploads/pixel8-1.jpg', thumbnailUrl: '/uploads/thumbs/pixel8-1.jpg' },
    { url: '/uploads/pixel8-2.jpg', thumbnailUrl: '/uploads/thumbs/pixel8-2.jpg' }
  ]
};

const mockGetProductResponse = {
  success: true,
  data: { product: mockProduct }
};

const renderWithRouter = (component, { route = '/admin/products/edit/test-product-id' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {component}
    </MemoryRouter>
  );
};

describe('AdminProductFormPage - Delete Product Functionality', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockNavigate.mockClear();
    
    // Default mock for getProductById
    adminService.getProductById.mockResolvedValue(mockGetProductResponse);
  });

  describe('Delete Button Rendering in Edit Mode', () => {
    test('should render delete button in edit mode', async () => {
      // Arrange & Act
      renderWithRouter(<AdminProductFormPage />);

      // Wait for product to load
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Assert
      expect(screen.getByRole('button', { name: 'Archive Product' })).toBeInTheDocument();
    });

    test('should not render delete button in create mode', async () => {
      // Arrange - Mock useParams to return no productId
      vi.doMock('react-router-dom', () => ({
        ...vi.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
        useParams: () => ({}) // No productId means create mode
      }));

      // Re-import component to pick up new mock
      const { default: AdminProductFormPageCreate } = await import('../AdminProductFormPage');

      // Act
      renderWithRouter(<AdminProductFormPageCreate />, { route: '/admin/products/new' });

      // Assert
      expect(screen.queryByRole('button', { name: 'Archive Product' })).not.toBeInTheDocument();
    });

    test('should render delete button with correct styling', async () => {
      // Arrange & Act
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Assert
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      expect(deleteButton).toHaveClass(
        'px-4', 'py-2', 'text-sm', 'font-medium', 'text-white', 
        'bg-red-600', 'border', 'border-transparent', 'rounded-md',
        'hover:bg-red-700', 'focus:outline-none', 'focus:ring-2', 
        'focus:ring-offset-2', 'focus:ring-red-500'
      );
    });

    test('should position delete button on the left side of form actions', async () => {
      // Arrange & Act
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Assert
      const formActions = screen.getByRole('button', { name: 'Archive Product' }).closest('div');
      expect(formActions).toHaveClass('flex', 'justify-between', 'items-center');
    });
  });

  describe('Delete Confirmation Modal', () => {
    test('should open confirmation modal when delete button is clicked', async () => {
      // Arrange
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);

      // Assert
      expect(screen.getByText('Archive Product')).toBeInTheDocument();
      expect(screen.getByText(`Are you sure you want to archive "${mockProduct.name}"?`)).toBeInTheDocument();
    });

    test('should display correct product name in confirmation modal', async () => {
      // Arrange
      const customProduct = { ...mockProduct, name: 'Custom Product Name' };
      adminService.getProductById.mockResolvedValue({
        success: true,
        data: { product: customProduct }
      });

      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);

      // Assert
      expect(screen.getByText('Are you sure you want to archive "Custom Product Name"?')).toBeInTheDocument();
    });

    test('should show soft delete explanation in modal', async () => {
      // Arrange
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);

      // Assert
      expect(screen.getByText('Soft Delete:')).toBeInTheDocument();
      expect(screen.getByText(/This will archive the product, removing it from the storefront/)).toBeInTheDocument();
      expect(screen.getByText(/The product can be restored later if needed/)).toBeInTheDocument();
    });

    test('should render modal with warning icon', async () => {
      // Arrange
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);

      // Assert
      const modal = screen.getByText('Archive Product').closest('.fixed');
      expect(modal).toBeInTheDocument();
      
      const warningIcon = modal.querySelector('svg');
      expect(warningIcon).toBeInTheDocument();
      expect(warningIcon).toHaveClass('h-6', 'w-6', 'text-red-600');
    });

    test('should render modal action buttons', async () => {
      // Arrange
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);

      // Assert
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Archive Product' })).toHaveLength(2); // One in form, one in modal
    });

    test('should close modal when cancel button is clicked', async () => {
      // Arrange
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      // Assert
      // Should only have one "Archive Product" button (the form button, not the modal button)
      expect(screen.getAllByRole('button', { name: 'Archive Product' })).toHaveLength(1);
    });
  });

  describe('Product Deletion Process', () => {
    test('should call deleteProduct service when confirmed', async () => {
      // Arrange
      adminService.deleteProduct.mockResolvedValue({ success: true });
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);
      
      const modalConfirmButton = screen.getAllByRole('button', { name: 'Archive Product' })[1]; // Modal button
      fireEvent.click(modalConfirmButton);

      // Assert
      await waitFor(() => {
        expect(adminService.deleteProduct).toHaveBeenCalledWith('test-product-id');
      });
    });

    test('should show loading state during deletion', async () => {
      // Arrange
      let resolveDelete;
      adminService.deleteProduct.mockReturnValue(new Promise(resolve => {
        resolveDelete = resolve;
      }));
      
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);
      
      const modalConfirmButton = screen.getAllByRole('button', { name: 'Archive Product' })[1];
      fireEvent.click(modalConfirmButton);

      // Assert
      expect(screen.getByRole('button', { name: 'Archiving...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Archiving...' })).toBeDisabled();

      // Cleanup
      resolveDelete({ success: true });
    });

    test('should disable form buttons during deletion', async () => {
      // Arrange
      let resolveDelete;
      adminService.deleteProduct.mockReturnValue(new Promise(resolve => {
        resolveDelete = resolve;
      }));
      
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);
      
      const modalConfirmButton = screen.getAllByRole('button', { name: 'Archive Product' })[1];
      fireEvent.click(modalConfirmButton);

      // Assert
      const formCancelButton = screen.getByRole('button', { name: 'Cancel' });
      const formSubmitButton = screen.getByRole('button', { name: 'Update Product' });
      
      expect(formCancelButton).toBeDisabled();
      expect(formSubmitButton).toBeDisabled();

      // Cleanup
      resolveDelete({ success: true });
    });

    test('should show success message after deletion', async () => {
      // Arrange
      adminService.deleteProduct.mockResolvedValue({ success: true });
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);
      
      const modalConfirmButton = screen.getAllByRole('button', { name: 'Archive Product' })[1];
      fireEvent.click(modalConfirmButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Product archived successfully')).toBeInTheDocument();
      });
    });

    test('should navigate to products list after successful deletion', async () => {
      // Arrange
      vi.useFakeTimers();
      adminService.deleteProduct.mockResolvedValue({ success: true });
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);
      
      const modalConfirmButton = screen.getAllByRole('button', { name: 'Archive Product' })[1];
      fireEvent.click(modalConfirmButton);

      await waitFor(() => {
        expect(screen.getByText('Product archived successfully')).toBeInTheDocument();
      });

      // Fast-forward 2 seconds (the timeout for navigation)
      vi.advanceTimersByTime(2000);

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith('/admin/products');

      vi.useRealTimers();
    });

    test('should close modal after successful deletion', async () => {
      // Arrange
      adminService.deleteProduct.mockResolvedValue({ success: true });
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);
      
      const modalConfirmButton = screen.getAllByRole('button', { name: 'Archive Product' })[1];
      fireEvent.click(modalConfirmButton);

      // Assert
      await waitFor(() => {
        // Should only have one "Archive Product" button (the form button)
        expect(screen.getAllByRole('button', { name: 'Archive Product' })).toHaveLength(1);
      });
    });
  });

  describe('Error Handling', () => {
    test('should show error message when deletion fails', async () => {
      // Arrange
      const errorMessage = 'Product not found';
      adminService.deleteProduct.mockRejectedValue(new Error(errorMessage));
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);
      
      const modalConfirmButton = screen.getAllByRole('button', { name: 'Archive Product' })[1];
      fireEvent.click(modalConfirmButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    test('should close modal when deletion fails', async () => {
      // Arrange
      adminService.deleteProduct.mockRejectedValue(new Error('Server error'));
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);
      
      const modalConfirmButton = screen.getAllByRole('button', { name: 'Archive Product' })[1];
      fireEvent.click(modalConfirmButton);

      // Assert
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: 'Archive Product' })).toHaveLength(1);
      });
    });

    test('should reset loading state when deletion fails', async () => {
      // Arrange
      adminService.deleteProduct.mockRejectedValue(new Error('Network error'));
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);
      
      const modalConfirmButton = screen.getAllByRole('button', { name: 'Archive Product' })[1];
      fireEvent.click(modalConfirmButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText('Archiving...')).not.toBeInTheDocument();
      });

      // Form buttons should be enabled again
      const formCancelButton = screen.getByRole('button', { name: 'Cancel' });
      const formSubmitButton = screen.getByRole('button', { name: 'Update Product' });
      
      expect(formCancelButton).not.toBeDisabled();
      expect(formSubmitButton).not.toBeDisabled();
    });

    test('should handle error with fallback message', async () => {
      // Arrange
      adminService.deleteProduct.mockRejectedValue(new Error());
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);
      
      const modalConfirmButton = screen.getAllByRole('button', { name: 'Archive Product' })[1];
      fireEvent.click(modalConfirmButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Failed to delete product')).toBeInTheDocument();
      });
    });

    test('should not navigate when deletion fails', async () => {
      // Arrange
      vi.useFakeTimers();
      adminService.deleteProduct.mockRejectedValue(new Error('Server error'));
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);
      
      const modalConfirmButton = screen.getAllByRole('button', { name: 'Archive Product' })[1];
      fireEvent.click(modalConfirmButton);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });

      // Fast-forward time to ensure no navigation occurs
      vi.advanceTimersByTime(5000);

      // Assert
      expect(mockNavigate).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Form Integration', () => {
    test('should not interfere with form submission', async () => {
      // Arrange
      adminService.updateProduct.mockResolvedValue({ success: true });
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const form = screen.getByRole('button', { name: 'Update Product' }).closest('form');
      fireEvent.submit(form);

      // Assert
      await waitFor(() => {
        expect(adminService.updateProduct).toHaveBeenCalled();
      });
      expect(adminService.deleteProduct).not.toHaveBeenCalled();
    });

    test('should handle form name changes for modal display', async () => {
      // Arrange
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act - Change product name
      const nameInput = screen.getByDisplayValue(mockProduct.name);
      fireEvent.change(nameInput, { target: { value: 'Updated Product Name' } });

      // Open delete modal
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);

      // Assert
      expect(screen.getByText('Are you sure you want to archive "Updated Product Name"?')).toBeInTheDocument();
    });

    test('should maintain form state during delete operation', async () => {
      // Arrange
      let resolveDelete;
      adminService.deleteProduct.mockReturnValue(new Promise(resolve => {
        resolveDelete = resolve;
      }));
      
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act - Modify form data
      const nameInput = screen.getByDisplayValue(mockProduct.name);
      fireEvent.change(nameInput, { target: { value: 'Modified Name' } });

      // Start delete operation
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);
      
      const modalConfirmButton = screen.getAllByRole('button', { name: 'Archive Product' })[1];
      fireEvent.click(modalConfirmButton);

      // Assert - Form data should be preserved
      expect(nameInput.value).toBe('Modified Name');

      // Cleanup
      resolveDelete({ success: true });
    });
  });

  describe('Accessibility', () => {
    test('should support keyboard navigation', async () => {
      // Arrange
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      
      // Assert
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton.tagName).toBe('BUTTON');
    });

    test('should have proper focus management in modal', async () => {
      // Arrange
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);

      // Assert
      const modal = screen.getByText('Archive Product').closest('.fixed');
      expect(modal).toBeInTheDocument();
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const confirmButton = screen.getAllByRole('button', { name: 'Archive Product' })[1];
      
      expect(cancelButton).toBeInTheDocument();
      expect(confirmButton).toBeInTheDocument();
    });

    test('should have appropriate disabled states', async () => {
      // Arrange
      let resolveDelete;
      adminService.deleteProduct.mockReturnValue(new Promise(resolve => {
        resolveDelete = resolve;
      }));
      
      renderWithRouter(<AdminProductFormPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Act
      const deleteButton = screen.getByRole('button', { name: 'Archive Product' });
      fireEvent.click(deleteButton);
      
      const modalConfirmButton = screen.getAllByRole('button', { name: 'Archive Product' })[1];
      fireEvent.click(modalConfirmButton);

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