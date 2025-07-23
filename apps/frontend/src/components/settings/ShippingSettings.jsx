import React, { useState, useEffect } from 'react';

const ShippingSettings = ({ onMessage }) => {
  const [shippingMethods, setShippingMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    estimatedDeliveryDays: { min: 1, max: 3 },
    baseCost: 0,
    criteria: {
      minWeight: 0,
      maxWeight: 50000,
      minOrderValue: 0,
      maxOrderValue: 999999.99,
      supportedCountries: ['GB', 'IE'],
      freeShippingThreshold: null
    },
    pricing: {
      weightRate: 0,
      baseWeight: 1000,
      dimensionalWeightFactor: 5000
    },
    isActive: true,
    displayOrder: 0
  });
  const [errors, setErrors] = useState({});

  const countries = [
    { code: 'GB', name: 'United Kingdom' },
    { code: 'IE', name: 'Ireland' },
    { code: 'US', name: 'United States' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' }
  ];

  useEffect(() => {
    loadShippingMethods();
  }, []);

  const loadShippingMethods = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/settings/shipping', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load shipping methods');
      }

      const data = await response.json();
      if (data.success) {
        setShippingMethods(data.data.shippingMethods || []);
      }
    } catch (error) {
      console.error('Load shipping methods error:', error);
      onMessage('Failed to load shipping methods', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name || '',
        code: method.code || '',
        description: method.description || '',
        estimatedDeliveryDays: method.estimatedDeliveryDays || { min: 1, max: 3 },
        baseCost: method.baseCost || 0,
        criteria: method.criteria || {
          minWeight: 0,
          maxWeight: 50000,
          minOrderValue: 0,
          maxOrderValue: 999999.99,
          supportedCountries: ['GB', 'IE'],
          freeShippingThreshold: null
        },
        pricing: method.pricing || {
          weightRate: 0,
          baseWeight: 1000,
          dimensionalWeightFactor: 5000
        },
        isActive: method.isActive !== undefined ? method.isActive : true,
        displayOrder: method.displayOrder || 0
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        estimatedDeliveryDays: { min: 1, max: 3 },
        baseCost: 0,
        criteria: {
          minWeight: 0,
          maxWeight: 50000,
          minOrderValue: 0,
          maxOrderValue: 999999.99,
          supportedCountries: ['GB', 'IE'],
          freeShippingThreshold: null
        },
        pricing: {
          weightRate: 0,
          baseWeight: 1000,
          dimensionalWeightFactor: 5000
        },
        isActive: true,
        displayOrder: 0
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMethod(null);
    setFormData({});
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters, numbers, and underscores';
    }

    if (formData.baseCost < 0) {
      newErrors.baseCost = 'Base cost cannot be negative';
    }

    if (formData.estimatedDeliveryDays.min < 1) {
      newErrors.deliveryMin = 'Minimum delivery days must be at least 1';
    }

    if (formData.estimatedDeliveryDays.max < formData.estimatedDeliveryDays.min) {
      newErrors.deliveryMax = 'Maximum delivery days must be greater than or equal to minimum';
    }

    if (formData.criteria.supportedCountries.length === 0) {
      newErrors.countries = 'At least one supported country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      onMessage('Please fix the validation errors', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingMethod 
        ? `/api/admin/settings/shipping/${editingMethod._id}`
        : '/api/admin/settings/shipping';
      const method = editingMethod ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save shipping method');
      }

      const data = await response.json();
      if (data.success) {
        onMessage(`Shipping method ${editingMethod ? 'updated' : 'created'} successfully`);
        closeModal();
        loadShippingMethods();
      } else {
        throw new Error(data.error || 'Failed to save shipping method');
      }
    } catch (error) {
      console.error('Save shipping method error:', error);
      onMessage(error.message || 'Failed to save shipping method', 'error');
    }
  };

  const handleDelete = async (methodId) => {
    if (!window.confirm('Are you sure you want to deactivate this shipping method?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`/api/admin/settings/shipping/${methodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete shipping method');
      }

      const data = await response.json();
      if (data.success) {
        onMessage('Shipping method deactivated successfully');
        loadShippingMethods();
      } else {
        throw new Error(data.error || 'Failed to delete shipping method');
      }
    } catch (error) {
      console.error('Delete shipping method error:', error);
      onMessage(error.message || 'Failed to delete shipping method', 'error');
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleCountryToggle = (countryCode) => {
    const currentCountries = formData.criteria.supportedCountries || [];
    const newCountries = currentCountries.includes(countryCode)
      ? currentCountries.filter(c => c !== countryCode)
      : [...currentCountries, countryCode];
    
    handleInputChange('criteria.supportedCountries', newCountries);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shipping methods...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Shipping Methods</h3>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Shipping Method
        </button>
      </div>

      {/* Shipping Methods Table */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shippingMethods.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No shipping methods found. Create your first shipping method to get started.
                  </td>
                </tr>
              ) : (
                shippingMethods.map((method) => (
                  <tr key={method._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{method.name}</div>
                        {method.description && (
                          <div className="text-sm text-gray-500">{method.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {method.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      £{method.baseCost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {method.formattedDelivery || `${method.estimatedDeliveryDays.min}-${method.estimatedDeliveryDays.max} days`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        method.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {method.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openModal(method)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      {method.isActive && (
                        <button
                          onClick={() => handleDelete(method._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingMethod ? 'Edit Shipping Method' : 'Add Shipping Method'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Standard Delivery"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.code ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="STANDARD"
                    />
                    {errors.code && (
                      <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Standard delivery for most items"
                  />
                </div>

                {/* Pricing and Delivery */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Cost (£) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.baseCost}
                      onChange={(e) => handleInputChange('baseCost', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.baseCost ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.baseCost && (
                      <p className="mt-1 text-sm text-red-600">{errors.baseCost}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Delivery Days *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.estimatedDeliveryDays.min}
                      onChange={(e) => handleInputChange('estimatedDeliveryDays.min', parseInt(e.target.value) || 1)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.deliveryMin ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.deliveryMin && (
                      <p className="mt-1 text-sm text-red-600">{errors.deliveryMin}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Delivery Days *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.estimatedDeliveryDays.max}
                      onChange={(e) => handleInputChange('estimatedDeliveryDays.max', parseInt(e.target.value) || 1)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.deliveryMax ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.deliveryMax && (
                      <p className="mt-1 text-sm text-red-600">{errors.deliveryMax}</p>
                    )}
                  </div>
                </div>

                {/* Supported Countries */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supported Countries *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {countries.map(country => (
                      <label key={country.code} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.criteria.supportedCountries.includes(country.code)}
                          onChange={() => handleCountryToggle(country.code)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{country.name}</span>
                      </label>
                    ))}
                  </div>
                  {errors.countries && (
                    <p className="mt-1 text-sm text-red-600">{errors.countries}</p>
                  )}
                </div>

                {/* Free Shipping Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Shipping Threshold (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.criteria.freeShippingThreshold || ''}
                    onChange={(e) => handleInputChange('criteria.freeShippingThreshold', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave empty for no free shipping"
                  />
                </div>

                {/* Status and Display Order */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.displayOrder}
                      onChange={(e) => handleInputChange('displayOrder', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingMethod ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingSettings;