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
    <form role="form" onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor={getFieldId('fullName')} className="form-label">Full Name *</label>
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
          className={`form-input ${errors.fullName ? 'form-input-error' : ''}`}
        />
        {errors.fullName && (
          <div id={getErrorId('fullName')} className="form-error" role="alert">
            {errors.fullName}
          </div>
        )}
      </div>

      <div>
        <label htmlFor={getFieldId('addressLine1')} className="form-label">Address Line 1 *</label>
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
          className={`form-input ${errors.addressLine1 ? 'form-input-error' : ''}`}
        />
        {errors.addressLine1 && (
          <div id={getErrorId('addressLine1')} className="form-error" role="alert">
            {errors.addressLine1}
          </div>
        )}
      </div>

      <div>
        <label htmlFor={getFieldId('addressLine2')} className="form-label">Address Line 2</label>
        <input
          id={getFieldId('addressLine2')}
          name="addressLine2"
          type="text"
          value={formData.addressLine2}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={isLoading}
          aria-describedby={errors.addressLine2 ? getErrorId('addressLine2') : undefined}
          className={`form-input ${errors.addressLine2 ? 'form-input-error' : ''}`}
        />
        {errors.addressLine2 && (
          <div id={getErrorId('addressLine2')} className="form-error" role="alert">
            {errors.addressLine2}
          </div>
        )}
      </div>

      <div>
        <label htmlFor={getFieldId('city')} className="form-label">City *</label>
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
          className={`form-input ${errors.city ? 'form-input-error' : ''}`}
        />
        {errors.city && (
          <div id={getErrorId('city')} className="form-error" role="alert">
            {errors.city}
          </div>
        )}
      </div>

      <div>
        <label htmlFor={getFieldId('stateProvince')} className="form-label">State/Province *</label>
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
          className={`form-input ${errors.stateProvince ? 'form-input-error' : ''}`}
        />
        {errors.stateProvince && (
          <div id={getErrorId('stateProvince')} className="form-error" role="alert">
            {errors.stateProvince}
          </div>
        )}
      </div>

      <div>
        <label htmlFor={getFieldId('postalCode')} className="form-label">Postal Code *</label>
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
          className={`form-input ${errors.postalCode ? 'form-input-error' : ''}`}
        />
        {errors.postalCode && (
          <div id={getErrorId('postalCode')} className="form-error" role="alert">
            {errors.postalCode}
          </div>
        )}
      </div>

      <div>
        <label htmlFor={getFieldId('country')} className="form-label">Country *</label>
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
          className={`form-input ${errors.country ? 'form-input-error' : ''}`}
        />
        {errors.country && (
          <div id={getErrorId('country')} className="form-error" role="alert">
            {errors.country}
          </div>
        )}
      </div>

      <div>
        <label htmlFor={getFieldId('phoneNumber')} className="form-label">Phone Number</label>
        <input
          id={getFieldId('phoneNumber')}
          name="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={isLoading}
          aria-describedby={errors.phoneNumber ? getErrorId('phoneNumber') : undefined}
          className={`form-input ${errors.phoneNumber ? 'form-input-error' : ''}`}
        />
        {errors.phoneNumber && (
          <div id={getErrorId('phoneNumber')} className="form-error" role="alert">
            {errors.phoneNumber}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4 pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Saving...' : isEdit ? 'Update Address' : 'Save Address'}
        </button>
      </div>
    </form>
  );
};

export default AddressForm;