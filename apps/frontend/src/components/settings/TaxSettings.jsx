import React, { useState, useEffect } from 'react';

const TaxSettings = ({ onMessage }) => {
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    country: 'GB',
    state: '',
    postalCode: '',
    rate: 20,
    type: 'VAT',
    calculationMethod: 'inclusive',
    isActive: true,
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    description: '',
    priority: 0,
    minimumOrderValue: 0
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

  const taxTypes = [
    { value: 'VAT', label: 'VAT (Value Added Tax)' },
    { value: 'GST', label: 'GST (Goods and Services Tax)' },
    { value: 'sales_tax', label: 'Sales Tax' },
    { value: 'import_duty', label: 'Import Duty' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadTaxRates();
  }, []);

  const loadTaxRates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/settings/taxes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load tax rates');
      }

      const data = await response.json();
      if (data.success) {
        setTaxRates(data.data.taxRates || []);
      }
    } catch (error) {
      console.error('Load tax rates error:', error);
      onMessage('Failed to load tax rates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (taxRate = null) => {
    if (taxRate) {
      setEditingTax(taxRate);
      setFormData({
        name: taxRate.name || '',
        region: taxRate.region || '',
        country: taxRate.country || 'GB',
        state: taxRate.state || '',
        postalCode: taxRate.postalCode || '',
        rate: taxRate.rate || 20,
        type: taxRate.type || 'VAT',
        calculationMethod: taxRate.calculationMethod || 'inclusive',
        isActive: taxRate.isActive !== undefined ? taxRate.isActive : true,
        effectiveFrom: taxRate.effectiveFrom ? new Date(taxRate.effectiveFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        effectiveTo: taxRate.effectiveTo ? new Date(taxRate.effectiveTo).toISOString().split('T')[0] : '',
        description: taxRate.description || '',
        priority: taxRate.priority || 0,
        minimumOrderValue: taxRate.minimumOrderValue || 0
      });
    } else {
      setEditingTax(null);
      setFormData({
        name: '',
        region: '',
        country: 'GB',
        state: '',
        postalCode: '',
        rate: 20,
        type: 'VAT',
        calculationMethod: 'inclusive',
        isActive: true,
        effectiveFrom: new Date().toISOString().split('T')[0],
        effectiveTo: '',
        description: '',
        priority: 0,
        minimumOrderValue: 0
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTax(null);
    setFormData({});
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.region.trim()) {
      newErrors.region = 'Region is required';
    }

    if (!formData.country) {
      newErrors.country = 'Country is required';
    }

    if (formData.rate < 0 || formData.rate > 100) {
      newErrors.rate = 'Tax rate must be between 0 and 100';
    }

    if (!formData.type) {
      newErrors.type = 'Tax type is required';
    }

    if (!formData.calculationMethod) {
      newErrors.calculationMethod = 'Calculation method is required';
    }

    if (formData.effectiveTo && formData.effectiveFrom > formData.effectiveTo) {
      newErrors.effectiveTo = 'Effective to date must be after effective from date';
    }

    if (formData.minimumOrderValue < 0) {
      newErrors.minimumOrderValue = 'Minimum order value cannot be negative';
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
      const url = editingTax 
        ? `/api/admin/settings/taxes/${editingTax._id}`
        : '/api/admin/settings/taxes';
      const method = editingTax ? 'PUT' : 'POST';
      
      const submitData = {
        ...formData,
        effectiveTo: formData.effectiveTo || null
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        throw new Error('Failed to save tax rate');
      }

      const data = await response.json();
      if (data.success) {
        onMessage(`Tax rate ${editingTax ? 'updated' : 'created'} successfully`);
        closeModal();
        loadTaxRates();
      } else {
        throw new Error(data.error || 'Failed to save tax rate');
      }
    } catch (error) {
      console.error('Save tax rate error:', error);
      onMessage(error.message || 'Failed to save tax rate', 'error');
    }
  };

  const handleDelete = async (taxRateId) => {
    if (!window.confirm('Are you sure you want to deactivate this tax rate?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`/api/admin/settings/taxes/${taxRateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete tax rate');
      }

      const data = await response.json();
      if (data.success) {
        onMessage('Tax rate deactivated successfully');
        loadTaxRates();
      } else {
        throw new Error(data.error || 'Failed to delete tax rate');
      }
    } catch (error) {
      console.error('Delete tax rate error:', error);
      onMessage(error.message || 'Failed to delete tax rate', 'error');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tax rates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Tax Rates</h3>
          <p className="text-sm text-gray-600">Configure tax rates for different regions and tax types</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Tax Rate
        </button>
      </div>

      {/* Tax Rates Table */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name & Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Effective Period
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
              {taxRates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No tax rates found. Create your first tax rate to get started.
                  </td>
                </tr>
              ) : (
                taxRates.map((taxRate) => (
                  <tr key={taxRate._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{taxRate.name}</div>
                        <div className="text-sm text-gray-500">
                          {taxRate.region}, {taxRate.country}
                          {taxRate.state && ` - ${taxRate.state}`}
                          {taxRate.postalCode && ` (${taxRate.postalCode})`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {taxRate.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {taxRate.rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        taxRate.calculationMethod === 'inclusive' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {taxRate.calculationMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{formatDate(taxRate.effectiveFrom)}</div>
                        <div className="text-xs text-gray-500">
                          to {formatDate(taxRate.effectiveTo) || 'Present'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        taxRate.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {taxRate.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openModal(taxRate)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      {taxRate.isActive && (
                        <button
                          onClick={() => handleDelete(taxRate._id)}
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
                  {editingTax ? 'Edit Tax Rate' : 'Add Tax Rate'}
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
                      placeholder="UK VAT Standard Rate"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Region *
                    </label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={(e) => handleInputChange('region', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.region ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="United Kingdom"
                    />
                    {errors.region && (
                      <p className="mt-1 text-sm text-red-600">{errors.region}</p>
                    )}
                  </div>
                </div>

                {/* Location Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.country ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      {countries.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    {errors.country && (
                      <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State/Province
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                {/* Tax Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Rate (%) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.rate}
                      onChange={(e) => handleInputChange('rate', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.rate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.rate && (
                      <p className="mt-1 text-sm text-red-600">{errors.rate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.type ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      {taxTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.type && (
                      <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calculation Method *
                    </label>
                    <select
                      value={formData.calculationMethod}
                      onChange={(e) => handleInputChange('calculationMethod', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.calculationMethod ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="inclusive">Tax Inclusive</option>
                      <option value="exclusive">Tax Exclusive</option>
                    </select>
                    {errors.calculationMethod && (
                      <p className="mt-1 text-sm text-red-600">{errors.calculationMethod}</p>
                    )}
                  </div>
                </div>

                {/* Effective Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Effective From *
                    </label>
                    <input
                      type="date"
                      value={formData.effectiveFrom}
                      onChange={(e) => handleInputChange('effectiveFrom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Effective To
                    </label>
                    <input
                      type="date"
                      value={formData.effectiveTo}
                      onChange={(e) => handleInputChange('effectiveTo', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.effectiveTo ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.effectiveTo && (
                      <p className="mt-1 text-sm text-red-600">{errors.effectiveTo}</p>
                    )}
                  </div>
                </div>

                {/* Additional Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                    <p className="mt-1 text-xs text-gray-500">Higher priority rates take precedence</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Order Value (£)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.minimumOrderValue}
                      onChange={(e) => handleInputChange('minimumOrderValue', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.minimumOrderValue ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.minimumOrderValue && (
                      <p className="mt-1 text-sm text-red-600">{errors.minimumOrderValue}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description of this tax rate"
                  />
                </div>

                {/* Active Status */}
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
                    {editingTax ? 'Update' : 'Create'}
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

export default TaxSettings;