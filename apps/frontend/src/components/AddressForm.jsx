import React, { useState, useEffect } from 'react';

// List of countries for the dropdown
const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IE', name: 'Ireland' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'HU', name: 'Hungary' },
  { code: 'RO', name: 'Romania' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'GR', name: 'Greece' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'IL', name: 'Israel' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'ZA', name: 'South Africa' }
].sort((a, b) => a.name.localeCompare(b.name));

const AddressForm = ({
  onSubmit,
  onCancel,
  initialData = {},
  isEdit = false,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: 'GB', // Default to UK
    phoneNumber: ''
  });

  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  useEffect(() => {
    // Only populate from initialData when it actually contains data.
    // The default `initialData = {}` is a fresh object on every render, so
    // depending on it would otherwise retrigger this effect and call
    // setFormData forever (an infinite update loop). The initial state above
    // already defaults country to 'GB', so there is nothing to do when empty.
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        fullName: initialData.fullName || '',
        addressLine1: initialData.addressLine1 || '',
        addressLine2: initialData.addressLine2 || '',
        city: initialData.city || '',
        stateProvince: initialData.stateProvince || '',
        postalCode: initialData.postalCode || '',
        country: initialData.country || 'GB', // Default to UK
        phoneNumber: initialData.phoneNumber || ''
      });
    }
  }, [initialData]);

  const validateField = (name, value) => {
    const requiredFields = ['fullName', 'addressLine1', 'city', 'stateProvince', 'postalCode', 'country'];

    if (requiredFields.includes(name) && !value.trim()) {
      return getRequiredFieldError(name);
    }

    if (name === 'phoneNumber' && value.trim()) {
      const phoneRegex = /^[+]?[1-9][\d\s\-()]{0,20}$/;
      if (!phoneRegex.test(value.trim())) {
        return 'Please enter a valid phone number';
      }
    }

    return '';
  };

  const getRequiredFieldError = (fieldName) => {
    const errorMessages = {
      fullName: 'Full name is required',
      addressLine1: 'Address line 1 is required',
      city: 'City is required',
      stateProvince: 'State/Province is required',
      postalCode: 'Postal code is required',
      country: 'Country is required'
    };
    return errorMessages[fieldName] || `${fieldName} is required`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));

    const error = validateField(name, value);

    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    setTouchedFields(
      Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isLoading) return;

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const getFieldId = (fieldName) => `address-${fieldName}`;
  const getErrorId = (fieldName) => `${fieldName}-error`;

  return (
    <form role="form" onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border-subtle">
        <div className="p-2 bg-cyan-subtle rounded-lg">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h2 className="font-heading font-semibold text-lg text-text-primary">{isEdit ? 'Edit Address' : 'Add New Address'}</h2>
          <p className="font-mono text-xs text-text-muted uppercase tracking-wider">Enter your delivery details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label htmlFor={getFieldId('fullName')} className="form-label">
            <span className="flex items-center gap-2">
              <svg aria-hidden="true" className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Full Name
            </span>
            <span aria-hidden="true" className="text-red-400 ml-1">*</span>
            <span className="sr-only">required</span>
          </label>
          <input
            id={getFieldId('fullName')}
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isLoading}
            required
            aria-required="true"
            aria-describedby={errors.fullName ? getErrorId('fullName') : undefined}
            className={`form-input ${errors.fullName && touchedFields.fullName ? 'form-input-error' : ''}`}
            placeholder="John Doe"
          />
          {errors.fullName && touchedFields.fullName && (
            <div id={getErrorId('fullName')} className="form-error" role="alert">
              <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.fullName}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor={getFieldId('addressLine1')} className="form-label">
            <span className="flex items-center gap-2">
              <svg aria-hidden="true" className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Address Line 1
            </span>
            <span aria-hidden="true" className="text-red-400 ml-1">*</span>
            <span className="sr-only">required</span>
          </label>
          <input
            id={getFieldId('addressLine1')}
            name="addressLine1"
            type="text"
            value={formData.addressLine1}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isLoading}
            required
            aria-required="true"
            aria-describedby={errors.addressLine1 ? getErrorId('addressLine1') : undefined}
            className={`form-input ${errors.addressLine1 && touchedFields.addressLine1 ? 'form-input-error' : ''}`}
            placeholder="Street address, P.O. box, etc."
          />
          {errors.addressLine1 && touchedFields.addressLine1 && (
            <div id={getErrorId('addressLine1')} className="form-error" role="alert">
              <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.addressLine1}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor={getFieldId('addressLine2')} className="form-label">
            <span className="flex items-center gap-2">
              <svg aria-hidden="true" className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Address Line 2
            </span>
            <span className="text-text-muted text-xs ml-2">(Optional)</span>
          </label>
          <input
            id={getFieldId('addressLine2')}
            name="addressLine2"
            type="text"
            value={formData.addressLine2}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isLoading}
            aria-describedby={errors.addressLine2 ? getErrorId('addressLine2') : undefined}
            className={`form-input ${errors.addressLine2 && touchedFields.addressLine2 ? 'form-input-error' : ''}`}
            placeholder="Apartment, suite, unit, building, floor, etc."
          />
        </div>

        <div>
          <label htmlFor={getFieldId('city')} className="form-label">
            <span className="flex items-center gap-2">
              <svg aria-hidden="true" className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              City
            </span>
            <span aria-hidden="true" className="text-red-400 ml-1">*</span>
            <span className="sr-only">required</span>
          </label>
          <input
            id={getFieldId('city')}
            name="city"
            type="text"
            value={formData.city}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isLoading}
            required
            aria-required="true"
            aria-describedby={errors.city ? getErrorId('city') : undefined}
            className={`form-input ${errors.city && touchedFields.city ? 'form-input-error' : ''}`}
            placeholder="City"
          />
          {errors.city && touchedFields.city && (
            <div id={getErrorId('city')} className="form-error" role="alert">
              <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.city}
            </div>
          )}
        </div>

        <div>
          <label htmlFor={getFieldId('stateProvince')} className="form-label">
            <span className="flex items-center gap-2">
              <svg aria-hidden="true" className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
              State/Province
            </span>
            <span aria-hidden="true" className="text-red-400 ml-1">*</span>
            <span className="sr-only">required</span>
          </label>
          <input
            id={getFieldId('stateProvince')}
            name="stateProvince"
            type="text"
            value={formData.stateProvince}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isLoading}
            required
            aria-required="true"
            aria-describedby={errors.stateProvince ? getErrorId('stateProvince') : undefined}
            className={`form-input ${errors.stateProvince && touchedFields.stateProvince ? 'form-input-error' : ''}`}
            placeholder="State or Province"
          />
          {errors.stateProvince && touchedFields.stateProvince && (
            <div id={getErrorId('stateProvince')} className="form-error" role="alert">
              <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.stateProvince}
            </div>
          )}
        </div>

        <div>
          <label htmlFor={getFieldId('postalCode')} className="form-label">
            <span className="flex items-center gap-2">
              <svg aria-hidden="true" className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              Postal Code
            </span>
            <span aria-hidden="true" className="text-red-400 ml-1">*</span>
            <span className="sr-only">required</span>
          </label>
          <input
            id={getFieldId('postalCode')}
            name="postalCode"
            type="text"
            value={formData.postalCode}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isLoading}
            required
            aria-required="true"
            aria-describedby={errors.postalCode ? getErrorId('postalCode') : undefined}
            className={`form-input ${errors.postalCode && touchedFields.postalCode ? 'form-input-error' : ''}`}
            placeholder="Postal or ZIP code"
          />
          {errors.postalCode && touchedFields.postalCode && (
            <div id={getErrorId('postalCode')} className="form-error" role="alert">
              <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.postalCode}
            </div>
          )}
        </div>

        <div>
          <label htmlFor={getFieldId('country')} className="form-label">
            <span className="flex items-center gap-2">
              <svg aria-hidden="true" className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Country
            </span>
            <span aria-hidden="true" className="text-red-400 ml-1">*</span>
            <span className="sr-only">required</span>
          </label>
          <select
            id={getFieldId('country')}
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isLoading}
            required
            aria-required="true"
            aria-describedby={errors.country ? getErrorId('country') : undefined}
            className={`form-input ${errors.country && touchedFields.country ? 'form-input-error' : ''}`}
          >
            <option value="">Select a country</option>
            {COUNTRIES.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          {errors.country && touchedFields.country && (
            <div id={getErrorId('country')} className="form-error" role="alert">
              <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.country}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor={getFieldId('phoneNumber')} className="form-label">
            <span className="flex items-center gap-2">
              <svg aria-hidden="true" className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Phone Number
            </span>
            <span className="text-text-muted text-xs ml-2">(Optional)</span>
          </label>
          <input
            id={getFieldId('phoneNumber')}
            name="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isLoading}
            aria-describedby={errors.phoneNumber ? getErrorId('phoneNumber') : undefined}
            className={`form-input ${errors.phoneNumber && touchedFields.phoneNumber ? 'form-input-error' : ''}`}
            placeholder="+44 20 1234 5678"
          />
          {errors.phoneNumber && touchedFields.phoneNumber && (
            <div id={getErrorId('phoneNumber')} className="form-error" role="alert">
              <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.phoneNumber}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-4 pt-6 mt-6 border-t border-border-subtle">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="btn btn-ghost w-full sm:w-auto"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : isEdit ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Update Address
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Save Address
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default AddressForm;
