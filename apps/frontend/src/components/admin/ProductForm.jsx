import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import VariationManager from './VariationManager';

const ProductForm = ({ product = null, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    shortDescription: '',
    longDescription: '',
    baseModel: '',
    category: '',
    tags: [],
    status: 'draft',
    attributes: [],
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    leadTime: {
      minDays: 5,
      maxDays: 7,
      displayText: '5-7 working days'
    },
    images: [],
    variations: []
  });

  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  // Initialize form with product data if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        shortDescription: product.shortDescription || '',
        longDescription: product.longDescription || '',
        baseModel: product.baseModel || '',
        category: product.category?._id || '',
        tags: product.tags || [],
        status: product.status || 'draft',
        attributes: product.attributes || [],
        weight: product.weight || '',
        dimensions: product.dimensions || { length: '', width: '', height: '' },
        leadTime: product.leadTime || { minDays: 5, maxDays: 7, displayText: '5-7 working days' },
        images: product.images || [],
        variations: product.variations || []
      });
    }
  }, [product]);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
        const response = await fetch(`${API_BASE_URL}/admin/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleNestedInputChange = (parentField, childField, value) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  };

  const handleTagsChange = (tagsString) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    handleInputChange('tags', tags);
  };

  const handleVariationsChange = (variations) => {
    handleInputChange('variations', variations);
  };

  const addAttribute = () => {
    const newAttribute = { name: '', value: '' };
    handleInputChange('attributes', [...formData.attributes, newAttribute]);
  };

  const updateAttribute = (index, field, value) => {
    const updatedAttributes = [...formData.attributes];
    updatedAttributes[index] = { ...updatedAttributes[index], [field]: value };
    handleInputChange('attributes', updatedAttributes);
  };

  const removeAttribute = (index) => {
    const updatedAttributes = formData.attributes.filter((_, i) => i !== index);
    handleInputChange('attributes', updatedAttributes);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.baseModel.trim()) newErrors.baseModel = 'Base model is required';
    if (formData.variations.length === 0) newErrors.variations = 'At least one variation is required';

    // Validate variations
    formData.variations.forEach((variation, index) => {
      if (!variation.condition) newErrors[`variation_${index}_condition`] = 'Condition is required';
      if (!variation.color.trim()) newErrors[`variation_${index}_color`] = 'Color is required';
      if (!variation.price || parseFloat(variation.price) <= 0) {
        newErrors[`variation_${index}_price`] = 'Valid price is required';
      }
      if (!variation.sku.trim()) newErrors[`variation_${index}_sku`] = 'SKU is required';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      dimensions: {
        length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : undefined,
        width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : undefined,
        height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : undefined
      }
    };

    onSubmit(submitData);
  };

  const getStatusOptions = () => [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto">
      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Google Pixel 8"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Model *
            </label>
            <input
              type="text"
              value={formData.baseModel}
              onChange={(e) => handleInputChange('baseModel', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.baseModel ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Pixel 8"
            />
            {errors.baseModel && <p className="text-red-500 text-xs mt-1">{errors.baseModel}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Auto-generated if empty"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getStatusOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => handleTagsChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="smartphone, privacy, secure (comma-separated)"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Short Description
          </label>
          <textarea
            value={formData.shortDescription}
            onChange={(e) => handleInputChange('shortDescription', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief product description for listings"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Long Description
          </label>
          <textarea
            value={formData.longDescription}
            onChange={(e) => handleInputChange('longDescription', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Detailed product description"
          />
        </div>
      </div>

      {/* Variations */}
      <div className="bg-white p-6 rounded-lg shadow">
        <VariationManager
          variations={formData.variations}
          onVariationsChange={handleVariationsChange}
        />
        {errors.variations && <p className="text-red-500 text-sm mt-2">{errors.variations}</p>}
      </div>

      {/* Physical Properties */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Physical Properties</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (g)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Length (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.dimensions.length}
              onChange={(e) => handleNestedInputChange('dimensions', 'length', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.dimensions.width}
              onChange={(e) => handleNestedInputChange('dimensions', 'width', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.dimensions.height}
              onChange={(e) => handleNestedInputChange('dimensions', 'height', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Lead Time */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Time</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Days
            </label>
            <input
              type="number"
              min="0"
              value={formData.leadTime.minDays}
              onChange={(e) => handleNestedInputChange('leadTime', 'minDays', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Days
            </label>
            <input
              type="number"
              min="0"
              value={formData.leadTime.maxDays}
              onChange={(e) => handleNestedInputChange('leadTime', 'maxDays', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Text
            </label>
            <input
              type="text"
              value={formData.leadTime.displayText}
              onChange={(e) => handleNestedInputChange('leadTime', 'displayText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5-7 working days"
            />
          </div>
        </div>
      </div>

      {/* Product Attributes */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Product Attributes</h2>
          <button
            type="button"
            onClick={addAttribute}
            className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors text-sm"
          >
            Add Attribute
          </button>
        </div>

        <div className="space-y-3">
          {formData.attributes.map((attribute, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="Attribute name"
                value={attribute.name}
                onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Attribute value"
                value={attribute.value}
                onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => removeAttribute(index)}
                className="text-red-600 hover:text-red-800 px-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
        </button>
      </div>
    </form>
  );
};

ProductForm.propTypes = {
  product: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

export default ProductForm;