import React from 'react';
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import { render } from '../../test/test-utils';
import { vi } from 'vitest';
import AdminCategoriesListPage from '../AdminCategoriesListPage';

// Mock utils/apiConfig (getAdminApiUrl) — import.meta.env not assignable
vi.mock('../../utils/apiConfig', () => ({
  getAdminApiUrl: (path) => `http://localhost:5000/api/${path}`
}));

const mockFetch = vi.fn();

describe('AdminCategoriesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    localStorage.setItem('adminToken', 'fake-admin-token');
  });

  afterEach(() => {
    localStorage.removeItem('adminToken');
    vi.unstubAllGlobals();
  });

  const jsonResponse = (data, ok = true) => ({
    ok,
    json: () => Promise.resolve(data)
  });

  const mockCategories = [
    {
      _id: 'cat1',
      name: 'Phones',
      slug: 'phones',
      description: 'Pixel phones',
      parentId: null,
      productCount: 5
    },
    {
      _id: 'cat2',
      name: 'Accessories',
      slug: 'accessories',
      description: 'Phone accessories',
      parentId: null,
      productCount: 0
    }
  ];

  it('shows loading state initially', async () => {
    // Never resolves
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(
        <AdminCategoriesListPage />

    );

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('loads and displays categories', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ data: { categories: mockCategories } })
    );

    render(
        <AdminCategoriesListPage />

    );

    await waitFor(() => {
      expect(screen.getByText('Phones')).toBeInTheDocument();
      expect(screen.getByText('Accessories')).toBeInTheDocument();
    });

    // Edit links and Delete buttons render
    expect(screen.getAllByText('Edit')).toHaveLength(2);
    expect(screen.getAllByText('Delete')).toHaveLength(2);
    // Header
    expect(screen.getByText('Manage Categories')).toBeInTheDocument();
    expect(screen.getByText('Add New Category')).toBeInTheDocument();
    expect(document.title).toBe('Manage Categories - Admin Dashboard');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/categories',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer fake-admin-token'
        })
      })
    );
  });

  it('shows error message when API fails', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ error: 'Failed to fetch categories' }, false)
    );

    render(
        <AdminCategoriesListPage />

    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch categories')).toBeInTheDocument();
    });
  });

  it('shows error when no auth token present', async () => {
    localStorage.removeItem('adminToken');
    mockFetch.mockResolvedValue(jsonResponse({ data: { categories: [] } }));

    render(
        <AdminCategoriesListPage />

    );

    await waitFor(() => {
      expect(screen.getByText('No authentication token found')).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shows empty state when no categories exist', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: { categories: [] } }));

    render(
        <AdminCategoriesListPage />

    );

    await waitFor(() => {
      expect(screen.getByText('No categories')).toBeInTheDocument();
    });
  });

  it('opens delete confirmation modal and deletes a category', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ data: { categories: mockCategories } })
    );

    render(
        <AdminCategoriesListPage />

    );

    await waitFor(() => {
      expect(screen.getByText('Phones')).toBeInTheDocument();
    });

    // Click first Delete button
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Modal appears
    await waitFor(() => {
      expect(screen.getByText('Delete Category')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete "Phones"/)).toBeInTheDocument();
    });

    // Mock delete success — second call returns ok, then re-render removes the card
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

    // Confirm delete — the modal Delete button is the last one rendered in the modal
    const modalDeleteButtons = screen.getAllByText('Delete');
    // Modal button is the one whose parent is the modal (last in DOM). Click the last.
    fireEvent.click(modalDeleteButtons[modalDeleteButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Category deleted successfully')).toBeInTheDocument();
    });
  });

  it('cancels delete confirmation modal', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ data: { categories: mockCategories } })
    );

    render(
        <AdminCategoriesListPage />

    );

    await waitFor(() => {
      expect(screen.getByText('Phones')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Delete')[0]);

    await waitFor(() => {
      expect(screen.getByText('Delete Category')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('Delete Category')).not.toBeInTheDocument();
    });
  });
});
