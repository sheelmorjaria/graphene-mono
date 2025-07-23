import React, { useState, useEffect } from 'react';

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
    country: '',
    phoneNumber: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        addressLine1: initialData.addressLine1 || '',
        addressLine2: initialData.addressLine2 || '',
        city: initialData.city || '',
        stateProvince: initialData.stateProvince || '',
        postalCode: initialData.postalCode || '',
        country: initialData.country || '',
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
    <form role="form" onSubmit={handleSubmit} className="address-form">
      <div className="form-group">
        <label htmlFor={getFieldId('fullName')}>Full Name *</label>
        <input
          id={getFieldId('fullName')}
          name="fullName"
          type="text"
          value={formData.fullName}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={isLoading}
          required
          aria-describedby={errors.fullName ? getErrorId('fullName') : undefined}
          className={errors.fullName ? 'error' : ''}
        />
        {errors.fullName && (
          <div id={getErrorId('fullName')} className="error-message" role="alert">
            {errors.fullName}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={getFieldId('addressLine1')}>Address Line 1 *</label>
        <input
          id={getFieldId('addressLine1')}
          name="addressLine1"
          type="text"
          value={formData.addressLine1}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={isLoading}
          required
          aria-describedby={errors.addressLine1 ? getErrorId('addressLine1') : undefined}
          className={errors.addressLine1 ? 'error' : ''}
        />
        {errors.addressLine1 && (
          <div id={getErrorId('addressLine1')} className="error-message" role="alert">
            {errors.addressLine1}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={getFieldId('addressLine2')}>Address Line 2</label>
        <input
          id={getFieldId('addressLine2')}
          name="addressLine2"
          type="text"
          value={formData.addressLine2}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={isLoading}
          aria-describedby={errors.addressLine2 ? getErrorId('addressLine2') : undefined}
          className={errors.addressLine2 ? 'error' : ''}
        />
        {errors.addressLine2 && (
          <div id={getErrorId('addressLine2')} className="error-message" role="alert">
            {errors.addressLine2}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={getFieldId('city')}>City *</label>
        <input
          id={getFieldId('city')}
          name="city"
          type="text"
          value={formData.city}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={isLoading}
          required
          aria-describedby={errors.city ? getErrorId('city') : undefined}
          className={errors.city ? 'error' : ''}
        />
        {errors.city && (
          <div id={getErrorId('city')} className="error-message" role="alert">
            {errors.city}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={getFieldId('stateProvince')}>State/Province *</label>
        <input
          id={getFieldId('stateProvince')}
          name="stateProvince"
          type="text"
          value={formData.stateProvince}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={isLoading}
          required
          aria-describedby={errors.stateProvince ? getErrorId('stateProvince') : undefined}
          className={errors.stateProvince ? 'error' : ''}
        />
        {errors.stateProvince && (
          <div id={getErrorId('stateProvince')} className="error-message" role="alert">
            {errors.stateProvince}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={getFieldId('postalCode')}>Postal Code *</label>
        <input
          id={getFieldId('postalCode')}
          name="postalCode"
          type="text"
          value={formData.postalCode}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={isLoading}
          required
          aria-describedby={errors.postalCode ? getErrorId('postalCode') : undefined}
          className={errors.postalCode ? 'error' : ''}
        />
        {errors.postalCode && (
          <div id={getErrorId('postalCode')} className="error-message" role="alert">
            {errors.postalCode}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={getFieldId('country')}>Country *</label>
        <input
          id={getFieldId('country')}
          name="country"
          type="text"
          value={formData.country}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={isLoading}
          required
          aria-describedby={errors.country ? getErrorId('country') : undefined}
          className={errors.country ? 'error' : ''}
        />
        {errors.country && (
          <div id={getErrorId('country')} className="error-message" role="alert">
            {errors.country}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={getFieldId('phoneNumber')}>Phone Number</label>
        <input
          id={getFieldId('phoneNumber')}
          name="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={isLoading}
          aria-describedby={errors.phoneNumber ? getErrorId('phoneNumber') : undefined}
          className={errors.phoneNumber ? 'error' : ''}
        />
        {errors.phoneNumber && (
          <div id={getErrorId('phoneNumber')} className="error-message" role="alert">
            {errors.phoneNumber}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Saving...' : isEdit ? 'Update Address' : 'Save Address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddressForm;