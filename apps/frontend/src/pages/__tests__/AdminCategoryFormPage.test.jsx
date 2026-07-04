import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminCategoryFormPage from '../AdminCategoryFormPage';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Helper to build a fetch Response-like object
const buildResponse = (body, ok = true) => ({
  ok,
  status: ok ? 200 : 400,
  json: async () => body
});

describe('AdminCategoryFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = '';
    // Provide an admin token so category loading proceeds
    localStorage.setItem('adminToken', 'fake-token');
    // Default fetch mock: returns an empty categories list
    global.fetch = vi.fn().mockResolvedValue(
      buildResponse({ data: { categories: [] } })
    );
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderPage = (path = '/admin/categories/new') => {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/categories/new" element={<AdminCategoryFormPage />} />
          <Route path="/admin/categories/:categoryId/edit" element={<AdminCategoryFormPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders the create form and sets document title', async () => {
    renderPage();

    expect(screen.getByText('Add New Category')).toBeInTheDocument();
    expect(document.title).toBe('Add Category - Admin Dashboard');
    expect(screen.getByLabelText(/Category Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Slug/i)).toBeInTheDocument();
  });

  it('loads and displays parent categories in the dropdown', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      buildResponse({
        data: {
          categories: [
            { _id: 'cat-1', name: 'Phones' },
            { _id: 'cat-2', name: 'Accessories' }
          ]
        }
      })
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Phones')).toBeInTheDocument();
      expect(screen.getByText('Accessories')).toBeInTheDocument();
    });
  });

  it('does not load categories when there is no admin token', async () => {
    localStorage.clear();
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    renderPage();

    // Give the effect a tick; fetch should never be called for categories list
    await new Promise((r) => setTimeout(r, 0));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('auto-generates slug from the category name', async () => {
    renderPage();

    const nameInput = screen.getByLabelText(/Category Name/i);
    fireEvent.change(nameInput, { target: { value: 'My Cool Category!' } });

    const slugInput = screen.getByPlaceholderText('category-slug');
    expect(slugInput.value).toBe('my-cool-category');
  });

  it('validates required fields on submit', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Create Category/i }));

    await waitFor(() => {
      expect(screen.getByText('Category name is required')).toBeInTheDocument();
      expect(screen.getByText('Slug is required')).toBeInTheDocument();
    });
  });

  it('validates slug format', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/Category Name/i), {
      target: { value: 'Test' }
    });
    // Manually set an invalid slug (stops auto-generation)
    const slugInput = screen.getByPlaceholderText('category-slug');
    fireEvent.change(slugInput, { target: { value: 'Invalid Slug!' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Category/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Slug can only contain lowercase letters, numbers, and hyphens')
      ).toBeInTheDocument();
    });
  });

  it('creates a category successfully and navigates', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      // POST = create submission; GET = categories list load
      if (opts && opts.method === 'POST') {
        return Promise.resolve(
          buildResponse({ data: { category: { _id: 'new' } } }, true)
        );
      }
      return Promise.resolve(buildResponse({ data: { categories: [] } }));
    });

    renderPage();

    fireEvent.change(screen.getByLabelText(/Category Name/i), {
      target: { value: 'New Cat' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Category/i }));

    await waitFor(() => {
      expect(screen.getByText('Category created successfully!')).toBeInTheDocument();
    });

    // navigate happens after a 2s timeout
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/categories');
      },
      { timeout: 3000 }
    );
  });

  it('shows an error when category creation fails', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      buildResponse({ error: 'Slug already exists' }, false)
    );

    renderPage();

    fireEvent.change(screen.getByLabelText(/Category Name/i), {
      target: { value: 'Dup' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Category/i }));

    await waitFor(() => {
      expect(screen.getByText('Slug already exists')).toBeInTheDocument();
    });
  });

  it('navigates back when Cancel is clicked', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/admin/categories');
  });

  it('loads an existing category in edit mode', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      // The single-category GET URL ends with /admin/categories/cat-123
      // (the list URL is /admin/categories). Distinguish by exact URL.
      if (url.endsWith('/admin/categories/cat-123')) {
        return Promise.resolve(
          buildResponse({
            data: {
              category: {
                _id: 'cat-123',
                name: 'Existing Cat',
                slug: 'existing-cat',
                description: 'A description',
                parentId: null
              }
            }
          })
        );
      }
      return Promise.resolve(buildResponse({ data: { categories: [] } }));
    });

    renderPage('/admin/categories/cat-123/edit');

    await waitFor(() => {
      expect(screen.getByText('Edit Category')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/Category Name/i).value).toBe('Existing Cat');
      expect(screen.getByPlaceholderText('category-slug').value).toBe('existing-cat');
    });
  });
});
