import React, { useState, useEffect, useCallback } from 'react';

const GeneralSettings = ({ onMessage }) => {
  const [settings, setSettings] = useState({
    storeName: '',
    storeEmail: '',
    storePhone: '',
    storeAddress: {
      street: '',
      city: '',
      postalCode: '',
      country: 'GB'
    },
    defaultCurrency: 'GBP',
    defaultLanguage: 'en-gb',
    businessRegistrationNumber: '',
    vatNumber: '',
    timezone: 'Europe/London',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24',
    isMaintenanceMode: false,
    maintenanceMessage: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const currencies = [
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' }
  ];

  const languages = [
    { code: 'en-gb', name: 'English (UK)' },
    { code: 'en-us', name: 'English (US)' },
    { code: 'fr-fr', name: 'French' },
    { code: 'de-de', name: 'German' },
    { code: 'es-es', name: 'Spanish' }
  ];

  const countries = [
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'IE', name: 'Ireland' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' }
  ];

  const timezones = [
    'Europe/London',
    'Europe/Dublin',
    'Europe/Paris',
    'Europe/Berlin',
    'America/New_York',
    'America/Los_Angeles',
    'America/Toronto',
    'Australia/Sydney'
  ];

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/settings/general', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Load settings error:', error);
      onMessage('Failed to load general settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [onMessage]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const validateForm = () => {
    const newErrors = {};

    if (!settings.storeName.trim()) {
      newErrors.storeName = 'Store name is required';
    }

    if (!settings.storeEmail.trim()) {
      newErrors.storeEmail = 'Store email is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(settings.storeEmail)) {
      newErrors.storeEmail = 'Invalid email format';
    }

    if (!settings.storeAddress.street.trim()) {
      newErrors['storeAddress.street'] = 'Street address is required';
    }

    if (!settings.storeAddress.city.trim()) {
      newErrors['storeAddress.city'] = 'City is required';
    }

    if (!settings.storeAddress.postalCode.trim()) {
      newErrors['storeAddress.postalCode'] = 'Postal code is required';
    }

    if (!settings.defaultCurrency) {
      newErrors.defaultCurrency = 'Default currency is required';
    }

    if (!settings.defaultLanguage) {
      newErrors.defaultLanguage = 'Default language is required';
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
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/settings/general', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        onMessage('General settings saved successfully');
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      onMessage(error.message || 'Failed to save general settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setSettings(prev => ({
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading general settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Store Information</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store Name */}
            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-2">
                Store Name *
              </label>
              <input
                type="text"
                id="storeName"
                value={settings.storeName}
                onChange={(e) => handleInputChange('storeName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.storeName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="GrapheneOS Store"
              />
              {errors.storeName && (
                <p className="mt-1 text-sm text-red-600">{errors.storeName}</p>
              )}
            </div>

            {/* Store Email */}
            <div>
              <label htmlFor="storeEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Store Email *
              </label>
              <input
                type="email"
                id="storeEmail"
                value={settings.storeEmail}
                onChange={(e) => handleInputChange('storeEmail', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.storeEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="support@grapheneos-store.com"
              />
              {errors.storeEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.storeEmail}</p>
              )}
            </div>

            {/* Store Phone */}
            <div>
              <label htmlFor="storePhone" className="block text-sm font-medium text-gray-700 mb-2">
                Store Phone
              </label>
              <input
                type="tel"
                id="storePhone"
                value={settings.storePhone}
                onChange={(e) => handleInputChange('storePhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+44 20 1234 5678"
              />
            </div>

            {/* Default Currency */}
            <div>
              <label htmlFor="defaultCurrency" className="block text-sm font-medium text-gray-700 mb-2">
                Default Currency *
              </label>
              <select
                id="defaultCurrency"
                value={settings.defaultCurrency}
                onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.defaultCurrency ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name}
                  </option>
                ))}
              </select>
              {errors.defaultCurrency && (
                <p className="mt-1 text-sm text-red-600">{errors.defaultCurrency}</p>
              )}
            </div>
          </div>

          {/* Store Address */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Store Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  id="street"
                  value={settings.storeAddress.street}
                  onChange={(e) => handleInputChange('storeAddress.street', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors['storeAddress.street'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="123 Privacy Street"
                />
                {errors['storeAddress.street'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['storeAddress.street']}</p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  value={settings.storeAddress.city}
                  onChange={(e) => handleInputChange('storeAddress.city', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors['storeAddress.city'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="London"
                />
                {errors['storeAddress.city'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['storeAddress.city']}</p>
                )}
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code *
                </label>
                <input
                  type="text"
                  id="postalCode"
                  value={settings.storeAddress.postalCode}
                  onChange={(e) => handleInputChange('storeAddress.postalCode', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors['storeAddress.postalCode'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="SW1A 1AA"
                />
                {errors['storeAddress.postalCode'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['storeAddress.postalCode']}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  id="country"
                  value={settings.storeAddress.country}
                  onChange={(e) => handleInputChange('storeAddress.country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Localization Settings */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Localization</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label htmlFor="defaultLanguage" className="block text-sm font-medium text-gray-700 mb-2">
                  Default Language *
                </label>
                <select
                  id="defaultLanguage"
                  value={settings.defaultLanguage}
                  onChange={(e) => handleInputChange('defaultLanguage', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.defaultLanguage ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {languages.map(language => (
                    <option key={language.code} value={language.code}>
                      {language.name}
                    </option>
                  ))}
                </select>
                {errors.defaultLanguage && (
                  <p className="mt-1 text-sm text-red-600">{errors.defaultLanguage}</p>
                )}
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timezones.map(timezone => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-2">
                  Date Format
                </label>
                <select
                  id="dateFormat"
                  value={settings.dateFormat}
                  onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Business Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="businessRegistrationNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Registration Number
                </label>
                <input
                  type="text"
                  id="businessRegistrationNumber"
                  value={settings.businessRegistrationNumber}
                  onChange={(e) => handleInputChange('businessRegistrationNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12345678"
                />
              </div>

              <div>
                <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  VAT Number
                </label>
                <input
                  type="text"
                  id="vatNumber"
                  value={settings.vatNumber}
                  onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="GB123456789"
                />
              </div>
            </div>
          </div>

          {/* Maintenance Mode */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Maintenance Mode</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isMaintenanceMode"
                  checked={settings.isMaintenanceMode}
                  onChange={(e) => handleInputChange('isMaintenanceMode', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isMaintenanceMode" className="ml-2 block text-sm text-gray-900">
                  Enable maintenance mode
                </label>
              </div>

              {settings.isMaintenanceMode && (
                <div>
                  <label htmlFor="maintenanceMessage" className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Message
                  </label>
                  <textarea
                    id="maintenanceMessage"
                    rows={3}
                    value={settings.maintenanceMessage}
                    onChange={(e) => handleInputChange('maintenanceMessage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="We are currently performing scheduled maintenance. Please check back soon."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeneralSettings;