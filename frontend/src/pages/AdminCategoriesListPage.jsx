import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

function AdminCategoriesListPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    document.title = 'Manage Categories - Admin Dashboard';
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories');
      }

      setCategories(data.data.categories || []);
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete category');
      }

      setSuccess('Category deleted successfully');
      setDeleteConfirm(null);
      
      // Remove deleted category from list
      setCategories(prev => prev.filter(cat => cat._id !== categoryId));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete category');
      setDeleteConfirm(null);
    }
  };

  const confirmDelete = (category) => {
    setDeleteConfirm(category);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Build hierarchical structure for display
  const buildHierarchy = (categories) => {
    const categoryMap = {};
    const rootCategories = [];

    // Create map of all categories
    categories.forEach(cat => {
      categoryMap[cat._id] = { ...cat, children: [] };
    });

    // Build hierarchy
    categories.forEach(cat => {
      if (cat.parentId) {
        const parent = categoryMap[cat.parentId._id || cat.parentId];
        if (parent) {
          parent.children.push(categoryMap[cat._id]);
        } else {
          rootCategories.push(categoryMap[cat._id]);
        }
      } else {
        rootCategories.push(categoryMap[cat._id]);
      }
    });

    return rootCategories;
  };

  const renderCategory = (category, level = 0) => {
    const indent = level * 20;
    
    return (
      <div key={category._id}>
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ marginLeft: `${indent}px` }}>
              {level > 0 && (
                <div className="w-4 h-4 border-l-2 border-b-2 border-gray-300 mr-2"></div>
              )}
              <div>
                <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <span>Slug: <code className="bg-gray-100 px-1 rounded">{category.slug}</code></span>
                  {category.parentId && (
                    <span>Parent: {category.parentId.name}</span>
                  )}
                  <span>{category.productCount || 0} product{category.productCount === 1 ? '' : 's'}</span>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link
                to={`/admin/categories/edit/${category._id}`}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit
              </Link>
              <button
                onClick={() => confirmDelete(category)}
                className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
        
        {/* Render children */}
        {category.children && category.children.map(child => 
          renderCategory(child, level + 1)
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const hierarchicalCategories = buildHierarchy(categories);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>
              <p className="mt-1 text-sm text-gray-600">
                Create and manage product categories for your store
              </p>
            </div>
            <Link
              to="/admin/categories/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add New Category
            </Link>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Categories List */}
        <div className="space-y-4">
          {hierarchicalCategories.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-6H5m14 12H5" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first product category.</p>
                <div className="mt-6">
                  <Link
                    to="/admin/categories/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add New Category
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            hierarchicalCategories.map(category => renderCategory(category))
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Category</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
                  </p>
                  {deleteConfirm.productCount > 0 && (
                    <p className="text-sm text-red-600 mt-2">
                      This category has {deleteConfirm.productCount} associated product(s).
                    </p>
                  )}
                  {deleteConfirm.children && deleteConfirm.children.length > 0 && (
                    <p className="text-sm text-red-600 mt-2">
                      This category has {deleteConfirm.children.length} child categor{deleteConfirm.children.length === 1 ? 'y' : 'ies'}.
                    </p>
                  )}
                </div>
                <div className="flex justify-center space-x-4 px-4 py-3">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(deleteConfirm._id)}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCategoriesListPage;