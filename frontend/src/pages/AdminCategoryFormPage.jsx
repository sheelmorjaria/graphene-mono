import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

function AdminCategoryFormPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(categoryId);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: ''
  });

  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [slugGenerated, setSlugGenerated] = useState(false);

  useEffect(() => {
    document.title = `${isEditMode ? 'Edit' : 'Add'} Category - Admin Dashboard`;
    loadCategories();
    
    if (isEditMode && categoryId) {
      loadCategory();
    }
  }, [isEditMode, categoryId]);

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch('/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok) {
        // Filter out current category (in edit mode) to prevent self-parenting
        const availableCategories = isEditMode 
          ? data.data.categories.filter(cat => cat._id !== categoryId)
          : data.data.categories;
        setCategories(availableCategories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadCategory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch category');
      }

      const category = data.data.category;
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        parentId: category.parentId?._id || ''
      });
    } catch (err) {
      setError(err.message || 'Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from name if slug hasn't been manually edited
    if (name === 'name' && (!formData.slug || slugGenerated)) {
      const generatedSlug = generateSlug(value);
      setFormData(prev => ({
        ...prev,
        slug: generatedSlug
      }));
      setSlugGenerated(true);
    }

    // If user manually edits slug, stop auto-generation
    if (name === 'slug') {
      setSlugGenerated(false);
    }

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const submitData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        parentId: formData.parentId || null
      };

      const url = isEditMode 
        ? `/api/admin/categories/${categoryId}`
        : '/api/admin/categories';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEditMode ? 'update' : 'create'} category`);
      }

      setSuccess(`Category ${isEditMode ? 'updated' : 'created'} successfully!`);
      
      setTimeout(() => {
        navigate('/admin/categories');
      }, 2000);
    } catch (err) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} category`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/categories');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Category' : 'Add New Category'}
          </h1>
        </div>

        {/* Form */}
        <div className="bg-white shadow-sm rounded-lg p-6">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter category name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.slug ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="category-slug"
              />
              {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
              <p className="mt-1 text-sm text-gray-500">
                URL-friendly identifier (lowercase letters, numbers, and hyphens only)
              </p>
            </div>

            {/* Parent Category */}
            <div>
              <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-2">
                Parent Category
              </label>
              <select
                id="parentId"
                name="parentId"
                value={formData.parentId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">None (Top-level category)</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Select a parent category to create a subcategory
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional description for this category"
              />
              <p className="mt-1 text-sm text-gray-500">
                Optional description to help customers understand this category
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : (isEditMode ? 'Update Category' : 'Create Category')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminCategoryFormPage;