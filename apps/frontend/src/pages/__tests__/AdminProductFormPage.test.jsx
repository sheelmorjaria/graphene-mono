import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminProductFormPage from '../AdminProductFormPage';

// Mock adminService
vi.mock('../../services/adminService', () => ({
  getProductById: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn()
}));

// Mock VariationManager: renders a button that, when clicked, pushes a valid
// phone variation into the form via onVariationsChange.
vi.mock('../../components/admin/VariationManager', () => {
  const VariationManager = ({ onVariationsChange }) => (
    <div data-testid="variation-manager">
      <button
        type="button"
        onClick={() =>
          onVariationsChange([
            {
              condition: 'new',
              color: 'black',
              storage: '128GB',
              price: '500',
              salePrice: '',
              stockQuantity: '5',
              stockStatus: 'in_stock',
              sku: 'VAR-1'
            }
          ])
        }
      >
        Add Valid Variation
      </button>
      <button
        type="button"
        onClick={() => onVariationsChange([])}
      >
        Clear Variations
      </button>
    </div>
  );
  return { default: VariationManager };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

import { getProductById, createProduct, updateProduct, deleteProduct } from '../../services/adminService';

const fillRequired = () => {
  fireEvent.change(screen.getByPlaceholderText('Enter product name'), {
    target: { value: 'Pixel 8' }
  });
  fireEvent.change(screen.getByPlaceholderText('Enter base SKU'), {
    target: { value: 'SKU-1' }
  });
  fireEvent.change(screen.getByPlaceholderText('e.g., Pixel 8'), {
    target: { value: 'Pixel 8' }
  });
};

const renderPage = (path = '/admin/products/new') => {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/products/new" element={<AdminProductFormPage />} />
        <Route path="/admin/products/:productId/edit" element={<AdminProductFormPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('AdminProductFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createProduct.mockResolvedValue({ success: true });
    updateProduct.mockResolvedValue({ success: true });
    deleteProduct.mockResolvedValue({ success: true });
  });

  it('renders the create form with default values', () => {
    renderPage();

    expect(screen.getByText('Add New Product')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter product name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter base SKU')).toBeInTheDocument();
    expect(screen.getByText('Create Product')).toBeInTheDocument();
    // Archive/delete button should NOT appear in create mode
    expect(screen.queryByText('Archive Product')).not.toBeInTheDocument();
  });

  it('validates required product fields and variation requirement', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Create Product/i }));

    await waitFor(() => {
      expect(screen.getByText('Product name is required')).toBeInTheDocument();
      expect(screen.getByText('SKU is required')).toBeInTheDocument();
      expect(screen.getByText('Base model is required')).toBeInTheDocument();
      expect(screen.getByText('At least one variation is required')).toBeInTheDocument();
    });
    expect(createProduct).not.toHaveBeenCalled();
  });

  it('creates a product successfully with valid data and navigates', async () => {
    renderPage();

    fillRequired();
    // Add a valid variation via the mocked VariationManager
    fireEvent.click(screen.getByText('Add Valid Variation'));

    fireEvent.click(screen.getByRole('button', { name: /Create Product/i }));

    await waitFor(() => {
      expect(createProduct).toHaveBeenCalledTimes(1);
    });

    // Success message
    await waitFor(() => {
      expect(screen.getByText('Product created successfully!')).toBeInTheDocument();
    });

    // Navigation after 2s timeout
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/products');
      },
      { timeout: 3000 }
    );
  });

  it('shows an error when creation fails', async () => {
    createProduct.mockRejectedValue(new Error('SKU taken'));

    renderPage();

    fillRequired();
    fireEvent.click(screen.getByText('Add Valid Variation'));
    fireEvent.click(screen.getByRole('button', { name: /Create Product/i }));

    await waitFor(() => {
      expect(screen.getByText('SKU taken')).toBeInTheDocument();
    });
  });

  it('updates the product status when the dropdown changes', () => {
    renderPage();

    const statusSelect = screen.getByLabelText(/Product Status/i);
    fireEvent.change(statusSelect, { target: { value: 'active' } });

    expect(statusSelect.value).toBe('active');
  });

  it('clears a field error when the user edits that field', async () => {
    renderPage();

    // Trigger validation errors
    fireEvent.click(screen.getByRole('button', { name: /Create Product/i }));
    await waitFor(() => {
      expect(screen.getByText('Product name is required')).toBeInTheDocument();
    });

    // Typing into the name field clears its error
    fireEvent.change(screen.getByPlaceholderText('Enter product name'), {
      target: { value: 'X' }
    });

    await waitFor(() => {
      expect(screen.queryByText('Product name is required')).not.toBeInTheDocument();
    });
  });

  it('loads an existing product in edit mode', async () => {
    getProductById.mockResolvedValue({
      success: true,
      data: {
        name: 'Existing Product',
        sku: 'EXIST-SKU',
        baseModel: 'Pixel 7',
        shortDescription: 'short',
        longDescription: 'long',
        category: { _id: 'cat-1' },
        tags: ['a', 'b'],
        status: 'active',
        leadTime: { minDays: 3, maxDays: 5, displayText: '3-5 days' },
        variations: [],
        images: []
      }
    });

    renderPage('/admin/products/prod-1/edit');

    await waitFor(() => {
      expect(screen.getByText('Edit Product')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter product name').value).toBe('Existing Product');
      expect(screen.getByPlaceholderText('Enter base SKU').value).toBe('EXIST-SKU');
    });
    // Archive button appears in edit mode
    expect(screen.getByText('Archive Product')).toBeInTheDocument();
  });

  it('opens the delete confirmation modal and archives the product', async () => {
    getProductById.mockResolvedValue({
      success: true,
      data: {
        name: 'To Delete',
        sku: 'DEL-SKU',
        baseModel: 'Pixel 7',
        status: 'active',
        variations: [],
        images: []
      }
    });

    renderPage('/admin/products/prod-2/edit');

    await waitFor(() => {
      expect(screen.getByText('Edit Product')).toBeInTheDocument();
    });

    // Open confirmation modal
    fireEvent.click(screen.getByText('Archive Product'));
    expect(screen.getByText(/Are you sure you want to archive/i)).toBeInTheDocument();

    // Confirm deletion
    const confirmButtons = screen.getAllByText('Archive Product');
    // The last Archive Product button is the one inside the modal
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(deleteProduct).toHaveBeenCalledWith('prod-2');
    });

    await waitFor(() => {
      expect(screen.getByText('Product archived successfully')).toBeInTheDocument();
    });
  });

  it('cancel button navigates back to products list', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/products');
  });
});
