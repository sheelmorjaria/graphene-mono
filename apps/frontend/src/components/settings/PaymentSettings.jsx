import React, { useState, useEffect } from 'react';

const PaymentSettings = ({ onMessage }) => {
  const [paymentGateways, setPaymentGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'credit_card',
    provider: 'other',
    isEnabled: false,
    isTestMode: true,
    supportedCurrencies: ['GBP'],
    supportedCountries: ['GB'],
    displayOrder: 0,
    description: '',
    customerMessage: '',
    config: {},
    fees: {
      fixedFee: 0,
      percentageFee: 0,
      feeCurrency: 'GBP'
    },
    limits: {
      minAmount: 0.01,
      maxAmount: 10000,
      dailyLimit: null
    },
    features: {
      supportsRefunds: false,
      supportsPartialRefunds: false,
      supportsRecurring: false,
      supportsPreauth: false,
      requiresRedirect: false,
      supportsWebhooks: false
    },
    security: {
      requiresSSL: true,
      pciCompliant: false,
      requires3DS: false
    }
  });
  const [errors, setErrors] = useState({});

  const gatewayTypes = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'digital_wallet', label: 'Digital Wallet' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cryptocurrency', label: 'Cryptocurrency' },
    { value: 'buy_now_pay_later', label: 'Buy Now Pay Later' }
  ];

  const providers = [
    { value: 'stripe', label: 'Stripe' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'square', label: 'Square' },
    { value: 'adyen', label: 'Adyen' },
    { value: 'bitcoin', label: 'Bitcoin' },
    { value: 'monero', label: 'Monero' },
    { value: 'other', label: 'Other' }
  ];

  const currencies = [
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' },
    { code: 'BTC', name: 'Bitcoin (₿)' },
    { code: 'XMR', name: 'Monero (ɱ)' }
  ];

  const countries = [
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'IE', name: 'Ireland' },
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
    loadPaymentGateways();
  }, []);

  const loadPaymentGateways = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/settings/payments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load payment gateways');
      }

      const data = await response.json();
      if (data.success) {
        setPaymentGateways(data.data.paymentGateways || []);
      }
    } catch (error) {
      console.error('Load payment gateways error:', error);
      onMessage('Failed to load payment gateways', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleGateway = async (gatewayId, enabled) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`/api/admin/settings/payments/${gatewayId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle payment gateway');
      }

      const data = await response.json();
      if (data.success) {
        onMessage(`Payment gateway ${enabled ? 'enabled' : 'disabled'} successfully`);
        loadPaymentGateways();
      } else {
        throw new Error(data.error || 'Failed to toggle payment gateway');
      }
    } catch (error) {
      console.error('Toggle payment gateway error:', error);
      onMessage(error.message || 'Failed to toggle payment gateway', 'error');
    }
  };

  const openModal = (gateway = null) => {
    if (gateway) {
      setEditingGateway(gateway);
      setFormData({
        name: gateway.name || '',
        code: gateway.code || '',
        type: gateway.type || 'credit_card',
        provider: gateway.provider || 'other',
        isEnabled: gateway.isEnabled || false,
        isTestMode: gateway.isTestMode !== undefined ? gateway.isTestMode : true,
        supportedCurrencies: gateway.supportedCurrencies || ['GBP'],
        supportedCountries: gateway.supportedCountries || ['GB'],
        displayOrder: gateway.displayOrder || 0,
        description: gateway.description || '',
        customerMessage: gateway.customerMessage || '',
        config: gateway.config || {},
        fees: gateway.fees || {
          fixedFee: 0,
          percentageFee: 0,
          feeCurrency: 'GBP'
        },
        limits: gateway.limits || {
          minAmount: 0.01,
          maxAmount: 10000,
          dailyLimit: null
        },
        features: gateway.features || {
          supportsRefunds: false,
          supportsPartialRefunds: false,
          supportsRecurring: false,
          supportsPreauth: false,
          requiresRedirect: false,
          supportsWebhooks: false
        },
        security: gateway.security || {
          requiresSSL: true,
          pciCompliant: false,
          requires3DS: false
        }
      });
    } else {
      setEditingGateway(null);
      setFormData({
        name: '',
        code: '',
        type: 'credit_card',
        provider: 'other',
        isEnabled: false,
        isTestMode: true,
        supportedCurrencies: ['GBP'],
        supportedCountries: ['GB'],
        displayOrder: 0,
        description: '',
        customerMessage: '',
        config: {},
        fees: {
          fixedFee: 0,
          percentageFee: 0,
          feeCurrency: 'GBP'
        },
        limits: {
          minAmount: 0.01,
          maxAmount: 10000,
          dailyLimit: null
        },
        features: {
          supportsRefunds: false,
          supportsPartialRefunds: false,
          supportsRecurring: false,
          supportsPreauth: false,
          requiresRedirect: false,
          supportsWebhooks: false
        },
        security: {
          requiresSSL: true,
          pciCompliant: false,
          requires3DS: false
        }
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGateway(null);
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

    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    if (!formData.provider) {
      newErrors.provider = 'Provider is required';
    }

    if (formData.supportedCurrencies.length === 0) {
      newErrors.currencies = 'At least one supported currency is required';
    }

    if (formData.supportedCountries.length === 0) {
      newErrors.countries = 'At least one supported country is required';
    }

    if (formData.fees.fixedFee < 0) {
      newErrors.fixedFee = 'Fixed fee cannot be negative';
    }

    if (formData.fees.percentageFee < 0 || formData.fees.percentageFee > 100) {
      newErrors.percentageFee = 'Percentage fee must be between 0 and 100';
    }

    if (formData.limits.minAmount < 0) {
      newErrors.minAmount = 'Minimum amount cannot be negative';
    }

    if (formData.limits.maxAmount <= formData.limits.minAmount) {
      newErrors.maxAmount = 'Maximum amount must be greater than minimum amount';
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
      const url = editingGateway 
        ? `/api/admin/settings/payments/${editingGateway._id}`
        : '/api/admin/settings/payments';
      const method = editingGateway ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save payment gateway');
      }

      const data = await response.json();
      if (data.success) {
        onMessage(`Payment gateway ${editingGateway ? 'updated' : 'created'} successfully`);
        closeModal();
        loadPaymentGateways();
      } else {
        throw new Error(data.error || 'Failed to save payment gateway');
      }
    } catch (error) {
      console.error('Save payment gateway error:', error);
      onMessage(error.message || 'Failed to save payment gateway', 'error');
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

  const handleArrayToggle = (field, value) => {
    const currentArray = formData[field] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    handleInputChange(field, newArray);
  };

  const getConfigFields = (provider) => {
    switch (provider) {
      case 'stripe':
        return ['stripePublishableKey'];
      case 'paypal':
        return ['paypalClientId'];
      case 'bitcoin':
        return ['bitcoinApiKey'];
      case 'monero':
        return ['moneroApiKey'];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment gateways...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Payment Gateways</h3>
          <p className="text-sm text-gray-600">Configure payment methods and their settings</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Payment Gateway
        </button>
      </div>

      {/* Payment Gateways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentGateways.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No payment gateways found. Create your first payment gateway to get started.
          </div>
        ) : (
          paymentGateways.map((gateway) => (
            <div key={gateway._id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      gateway.isEnabled ? 'bg-green-400' : 'bg-gray-400'
                    }`}></div>
                    <h3 className="text-lg font-medium text-gray-900">{gateway.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openModal(gateway)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleGateway(gateway._id, !gateway.isEnabled)}
                      className={`text-sm ${
                        gateway.isEnabled 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {gateway.isEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Provider:</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">{gateway.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Type:</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">{gateway.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Mode:</span>
                    <span className={`text-sm font-medium ${
                      gateway.isTestMode ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {gateway.isTestMode ? 'Test' : 'Live'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Configuration:</span>
                    <span className={`text-sm font-medium ${
                      gateway.isProperlyConfigured ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {gateway.isProperlyConfigured ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                </div>

                {gateway.description && (
                  <p className="mt-4 text-sm text-gray-600">{gateway.description}</p>
                )}

                <div className="mt-4">
                  <div className="flex flex-wrap gap-1">
                    {gateway.supportedCurrencies.slice(0, 3).map(currency => (
                      <span key={currency} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {currency}
                      </span>
                    ))}
                    {gateway.supportedCurrencies.length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        +{gateway.supportedCurrencies.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingGateway ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
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

              <form onSubmit={handleSubmit} className="space-y-6 max-h-96 overflow-y-auto">
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
                      placeholder="PayPal"
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
                      placeholder="PAYPAL"
                    />
                    {errors.code && (
                      <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                    )}
                  </div>
                </div>

                {/* Type and Provider */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.type ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      {gatewayTypes.map(type => (
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
                      Provider *
                    </label>
                    <select
                      value={formData.provider}
                      onChange={(e) => handleInputChange('provider', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.provider ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      {providers.map(provider => (
                        <option key={provider.value} value={provider.value}>
                          {provider.label}
                        </option>
                      ))}
                    </select>
                    {errors.provider && (
                      <p className="mt-1 text-sm text-red-600">{errors.provider}</p>
                    )}
                  </div>
                </div>

                {/* Configuration Fields */}
                {getConfigFields(formData.provider).map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </label>
                    <input
                      type={field.includes('Secret') || field.includes('Key') ? 'password' : 'text'}
                      value={formData.config[field] || ''}
                      onChange={(e) => handleInputChange(`config.${field}`, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter ${field}`}
                    />
                  </div>
                ))}

                {/* Supported Currencies */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supported Currencies *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {currencies.map(currency => (
                      <label key={currency.code} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.supportedCurrencies.includes(currency.code)}
                          onChange={() => handleArrayToggle('supportedCurrencies', currency.code)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{currency.name}</span>
                      </label>
                    ))}
                  </div>
                  {errors.currencies && (
                    <p className="mt-1 text-sm text-red-600">{errors.currencies}</p>
                  )}
                </div>

                {/* Supported Countries */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supported Countries *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {countries.map(country => (
                      <label key={country.code} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.supportedCountries.includes(country.code)}
                          onChange={() => handleArrayToggle('supportedCountries', country.code)}
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

                {/* Status Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isEnabled}
                      onChange={(e) => handleInputChange('isEnabled', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Enabled
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isTestMode}
                      onChange={(e) => handleInputChange('isTestMode', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Test Mode
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
                <div className="flex justify-end space-x-3 pt-4 border-t">
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
                    {editingGateway ? 'Update' : 'Create'}
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

export default PaymentSettings;