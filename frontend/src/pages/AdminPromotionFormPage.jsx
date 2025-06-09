import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaSpinner } from 'react-icons/fa';
import promotionService from '../services/promotionService';
import { getProducts } from '../services/adminService';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminPromotionFormPage = () => {
  const navigate = useNavigate();
  const { promoId } = useParams();
  const isEditMode = !!promoId;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeAvailable, setCodeAvailable] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    type: 'percentage',
    value: '',
    minimumOrderAmount: 0,
    applicableProducts: [],
    applicableCategories: [],
    totalUsageLimit: '',
    perUserUsageLimit: 1,
    startDate: '',
    endDate: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchCategoriesAndProducts();
    if (isEditMode) {
      fetchPromotion();
    }
  }, [promoId]);

  const fetchCategoriesAndProducts = async () => {
    try {
      // For now, just fetch products. Categories can be added later
      const productsRes = await getProducts({ limit: 100 });
      setProducts(productsRes.products || []);
      // Mock categories for demo
      setCategories([
        { _id: '1', name: 'Smartphones' },
        { _id: '2', name: 'Accessories' }
      ]);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchPromotion = async () => {
    try {
      setInitialLoading(true);
      const response = await promotionService.getPromotionById(promoId);
      const promotion = response.promotion;
      
      setFormData({
        name: promotion.name,
        code: promotion.code,
        description: promotion.description || '',
        type: promotion.type,
        value: promotion.value || '',
        minimumOrderAmount: promotion.minimumOrderAmount || 0,
        applicableProducts: promotion.applicableProducts?.map(p => p._id) || [],
        applicableCategories: promotion.applicableCategories?.map(c => c._id) || [],
        totalUsageLimit: promotion.totalUsageLimit || '',
        perUserUsageLimit: promotion.perUserUsageLimit || 1,
        startDate: new Date(promotion.startDate).toISOString().split('T')[0],
        endDate: new Date(promotion.endDate).toISOString().split('T')[0],
        status: promotion.status
      });
    } catch (err) {
      setError(err.message || 'Failed to load promotion');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type: inputType } = e.target;
    let processedValue = value;

    if (inputType === 'number') {
      processedValue = value === '' ? '' : parseFloat(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear validation error for this field
    setValidationErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const handleMultiSelectChange = (e, field) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      [field]: selectedOptions
    }));
  };

  const handleCodeChange = async (e) => {
    const code = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, code }));

    if (code.length >= 3) {
      setCheckingCode(true);
      try {
        const response = await promotionService.checkCodeUniqueness(code, isEditMode ? promoId : null);
        setCodeAvailable(response.isUnique);
        if (!response.isUnique) {
          setValidationErrors(prev => ({
            ...prev,
            code: 'This code is already in use'
          }));
        } else {
          setValidationErrors(prev => ({
            ...prev,
            code: ''
          }));
        }
      } catch (err) {
        console.error('Failed to check code uniqueness:', err);
      } finally {
        setCheckingCode(false);
      }
    }
  };

  const generateCode = () => {
    const randomCode = `PROMO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setFormData(prev => ({ ...prev, code: randomCode }));
    handleCodeChange({ target: { value: randomCode } });
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.code.trim()) {
      errors.code = 'Code is required';
    } else if (formData.code.length < 3) {
      errors.code = 'Code must be at least 3 characters';
    } else if (!codeAvailable) {
      errors.code = 'This code is already in use';
    }

    if (formData.type !== 'free_shipping') {
      if (!formData.value || formData.value <= 0) {
        errors.value = 'Value must be greater than 0';
      }
      if (formData.type === 'percentage' && formData.value > 100) {
        errors.value = 'Percentage cannot exceed 100%';
      }
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      errors.endDate = 'End date must be after start date';
    }

    if (formData.totalUsageLimit && formData.totalUsageLimit < 1) {
      errors.totalUsageLimit = 'Total usage limit must be at least 1';
    }

    if (formData.perUserUsageLimit < 1) {
      errors.perUserUsageLimit = 'Per user usage limit must be at least 1';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      const dataToSend = {
        ...formData,
        totalUsageLimit: formData.totalUsageLimit || null,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      };

      if (isEditMode) {
        await promotionService.updatePromotion(promoId, dataToSend);
      } else {
        await promotionService.createPromotion(dataToSend);
      }

      navigate('/admin/promotions');
    } catch (err) {
      setError(err.message || 'Failed to save promotion');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/promotions')}
          className="text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Promotion' : 'Create New Promotion'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        {/* General Information */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">General Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Promotion Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Summer Sale 2024"
              />
              {validationErrors.name && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Promotion Code *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleCodeChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase ${
                      validationErrors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., SUMMER20"
                  />
                  {checkingCode && (
                    <FaSpinner className="absolute right-3 top-3 text-gray-400 animate-spin" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={generateCode}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Generate
                </button>
              </div>
              {validationErrors.code && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.code}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the promotion..."
            />
          </div>
        </div>

        {/* Discount Configuration */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Discount Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="percentage">Percentage Off</option>
                <option value="fixed_amount">Fixed Amount Off</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>

            {formData.type !== 'free_shipping' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">
                    {formData.type === 'percentage' ? '%' : '£'}
                  </span>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    min="0"
                    max={formData.type === 'percentage' ? '100' : undefined}
                    step="0.01"
                    className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.value ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {validationErrors.value && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.value}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order Amount (£)
              </label>
              <input
                type="number"
                name="minimumOrderAmount"
                value={formData.minimumOrderAmount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Applicability */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Applicability</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Applicable Categories
              </label>
              <select
                multiple
                value={formData.applicableCategories}
                onChange={(e) => handleMultiSelectChange(e, 'applicableCategories')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                size={4}
              >
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Hold Ctrl/Cmd to select multiple. Leave empty for all categories.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Applicable Products
              </label>
              <select
                multiple
                value={formData.applicableProducts}
                onChange={(e) => handleMultiSelectChange(e, 'applicableProducts')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                size={4}
              >
                {products.map(product => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Hold Ctrl/Cmd to select multiple. Leave empty for all products.
              </p>
            </div>
          </div>
        </div>

        {/* Usage Limits */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Usage Limits</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Usage Limit
              </label>
              <input
                type="number"
                name="totalUsageLimit"
                value={formData.totalUsageLimit}
                onChange={handleInputChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.totalUsageLimit ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Leave empty for unlimited"
              />
              {validationErrors.totalUsageLimit && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.totalUsageLimit}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Per User Usage Limit *
              </label>
              <input
                type="number"
                name="perUserUsageLimit"
                value={formData.perUserUsageLimit}
                onChange={handleInputChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.perUserUsageLimit ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.perUserUsageLimit && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.perUserUsageLimit}</p>
              )}
            </div>
          </div>
        </div>

        {/* Validity Period */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Validity Period</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.startDate && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.endDate && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.endDate}</p>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Status</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/admin/promotions')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || checkingCode || !codeAvailable}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? (
              <>
                <FaSpinner className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FaSave />
                {isEditMode ? 'Update Promotion' : 'Create Promotion'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPromotionFormPage;