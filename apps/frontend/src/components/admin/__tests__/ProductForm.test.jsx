import React from 'react';
import { render, screen, act, fireEvent } from '../../../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock VariationManager so we can drive variations directly.
vi.mock('../VariationManager', () => ({
  __esModule: true,
  default: ({ variations, onVariationsChange }) => (
    <div data-testid="variation-manager-mock">
      <button
        type="button"
        onClick={() =>
          onVariationsChange([
            ...variations,
            {
              condition: 'new',
              color: 'Black',
              storage: '128GB',
              price: '899.99',
              sku: 'SKU-1',
              stockQuantity: 5
            }
          ])
        }
      >
        Add Variation
      </button>
      <span data-testid="variation-count">{variations.length}</span>
    </div>
  )
}));

// Mock apiConfig.getAdminApiUrl so the category fetch uses a stable URL.
vi.mock('../../../utils/apiConfig', () => ({
  getAdminApiUrl: (endpoint) => `http://localhost:5000/api/admin/${endpoint}`,
  API_BASE_URL: 'http://localhost:5000/api'
}));

import ProductForm from '../ProductForm';

// Default category-fetch mock; overridable per-test via setCategoryFetch.
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: [] })
});

function renderForm(props = {}) {
  const original = global.fetch;
  global.fetch = mockFetch;
  const utils = render(<ProductForm {...props} />);
  utils.restoreFetch = () => {
    global.fetch = original;
  };
  return utils;
}

describe('ProductForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] })
    });
  });

  it('renders the basic form fields', async () => {
    renderForm();
    expect(screen.getByPlaceholderText('e.g., Google Pixel 8')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., Pixel 8')).toBeInTheDocument();
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Physical Properties')).toBeInTheDocument();
    expect(screen.getByText('Lead Time')).toBeInTheDocument();
    expect(screen.getByText('Product Attributes')).toBeInTheDocument();
    expect(screen.getByTestId('variation-manager-mock')).toBeInTheDocument();
  });

  it('shows "Create Product" submit text when no product given', () => {
    renderForm();
    expect(
      screen.getByRole('button', { name: /create product/i })
    ).toBeInTheDocument();
  });

  it('shows "Update Product" submit text when editing an existing product', () => {
    renderForm({ product: { _id: 'p1', name: 'Pixel 8' } });
    expect(
      screen.getByRole('button', { name: /update product/i })
    ).toBeInTheDocument();
  });

  it('fetches categories on mount', async () => {
    renderForm();

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/admin/categories'
    );
  });

  it('updates input fields when typing', async () => {
    renderForm();
    const nameInput = screen.getByPlaceholderText('e.g., Google Pixel 8');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Pixel 9' } });
    });

    expect(nameInput).toHaveValue('Pixel 9');
  });

  it('parses tags into an array on change', async () => {
    renderForm();
    const tagsInput = screen.getByPlaceholderText(/comma-separated/i);

    await act(async () => {
      fireEvent.change(tagsInput, { target: { value: 'privacy, secure, smartphone' } });
    });

    expect(tagsInput).toHaveValue('privacy, secure, smartphone');
  });

  it('adds and removes attributes', async () => {
    renderForm();

    const addBtn = screen.getByRole('button', { name: /add attribute/i });

    await act(async () => {
      addBtn.click();
    });

    expect(screen.getByPlaceholderText('Attribute name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Attribute value')).toBeInTheDocument();

    // Remove it.
    await act(async () => {
      screen.getByRole('button', { name: /remove/i }).click();
    });

    expect(screen.queryByPlaceholderText('Attribute name')).not.toBeInTheDocument();
  });

  it('validates required fields and shows errors on empty submit', async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    await act(async () => {
      fireEvent.submit(screen.getByPlaceholderText('e.g., Google Pixel 8').closest('form'));
    });

    expect(screen.getByText('Product name is required')).toBeInTheDocument();
    expect(screen.getByText('Base model is required')).toBeInTheDocument();
    expect(screen.getByText('At least one variation is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onCancel when the cancel button is clicked', async () => {
    const onCancel = vi.fn();
    renderForm({ onCancel });

    await act(async () => {
      screen.getByRole('button', { name: /cancel/i }).click();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('submits valid form data parsed into correct types', async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    // Fill required fields.
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('e.g., Google Pixel 8'), {
        target: { value: 'Pixel 9' }
      });
    });
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('e.g., Pixel 8'), {
        target: { value: 'Pixel 9' }
      });
    });

    // Add a valid variation via the mocked VariationManager.
    await act(async () => {
      screen.getByRole('button', { name: 'Add Variation' }).click();
    });

    // Submit.
    await act(async () => {
      fireEvent.submit(
        screen.getByPlaceholderText('e.g., Google Pixel 8').closest('form')
      );
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.name).toBe('Pixel 9');
    expect(submitted.baseModel).toBe('Pixel 9');
    expect(submitted.variations).toHaveLength(1);
  });

  it('disables submit button and shows "Saving..." when isLoading is true', () => {
    renderForm({ isLoading: true });
    const submitBtn = screen.getByRole('button', { name: /saving/i });
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent('Saving...');
  });

  it('updates nested dimension fields', async () => {
    renderForm();
    // The dimension inputs all share placeholder "0"; query them all.
    const numberInputs = screen.getAllByPlaceholderText('0');
    // First number input is Weight, then length/width/height.
    await act(async () => {
      fireEvent.change(numberInputs[1], { target: { value: '15' } });
    });
    expect(numberInputs[1]).toHaveValue(15);
  });

  it('updates lead time fields via nested change handler', async () => {
    renderForm();
    const minDaysInput = screen.getByDisplayValue('5');
    await act(async () => {
      fireEvent.change(minDaysInput, { target: { value: '3' } });
    });
    expect(minDaysInput).toHaveValue(3);
  });
});
