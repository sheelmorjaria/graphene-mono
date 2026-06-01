import React, { useState } from 'react';
import {
  createFlashOrder,
  SUPPORTED_PIXEL_MODELS,
  FLASH_ORDER_PRICING,
  formatFlashOrderCurrency
} from '../../services/flashOrderService';

const FlashServiceForm = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    customerEmail: '',
    pixelModel: '',
    returnAddress: {
      fullName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      stateProvince: '',
      postalCode: '',
      country: 'GB',
      phoneNumber: ''
    },
    factoryResetConfirmed: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = () => {
    if (!formData.factoryResetConfirmed) return false;

    const hasEmail = validateEmail(formData.customerEmail);
    const hasPixelModel = formData.pixelModel !== '';

    const address = formData.returnAddress;
    const hasRequiredAddressFields =
      address.fullName.trim() !== '' &&
      address.addressLine1.trim() !== '' &&
      address.city.trim() !== '' &&
      address.stateProvince.trim() !== '' &&
      address.postalCode.trim() !== '';

    return hasEmail && hasPixelModel && hasRequiredAddressFields;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      returnAddress: {
        ...prev.returnAddress,
        [field]: value
      }
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleEmailBlur = () => {
    if (formData.customerEmail && !validateEmail(formData.customerEmail)) {
      setErrors(prev => ({
        ...prev,
        customerEmail: 'Please enter a valid email address'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!isFormValid()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        customerEmail: formData.customerEmail,
        pixelModel: formData.pixelModel,
        returnAddress: {
          fullName: formData.returnAddress.fullName,
          addressLine1: formData.returnAddress.addressLine1,
          city: formData.returnAddress.city,
          stateProvince: formData.returnAddress.stateProvince,
          postalCode: formData.returnAddress.postalCode,
          country: formData.returnAddress.country,
          phoneNumber: formData.returnAddress.phoneNumber
        },
        factoryResetConfirmed: true
      };

      // Only include optional fields if they have values
      if (formData.returnAddress.addressLine2?.trim()) {
        orderData.returnAddress.addressLine2 = formData.returnAddress.addressLine2;
      }

      const response = await createFlashOrder(orderData);
      onSuccess(response);
    } catch (error) {
      onError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const emailError = submitAttempted && formData.customerEmail && !validateEmail(formData.customerEmail)
    ? 'Please enter a valid email address'
    : errors.customerEmail;

  const showEmailError = emailError || (formData.customerEmail && errors.customerEmail);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 p-6 bg-bg-card rounded-lg border border-border-subtle">
        <h2 className="text-2xl font-display font-bold text-text-primary mb-4">
          GrapheneOS Flashing Service
        </h2>
        <p className="text-text-secondary mb-4">
          Send us your Pixel device and we'll flash it with GrapheneOS, the privacy-focused mobile OS.
          After payment, you'll receive shipping instructions and our PO Box address.
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Flashing Service:</span>
            <span className="text-text-primary font-mono">{formatFlashOrderCurrency(FLASH_ORDER_PRICING.basePrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Return Shipping:</span>
            <span className="text-text-primary font-mono">{formatFlashOrderCurrency(FLASH_ORDER_PRICING.returnShipping)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border-subtle">
            <span className="text-text-primary font-semibold">Total:</span>
            <span className="text-cyan-400 font-mono font-bold">{formatFlashOrderCurrency(FLASH_ORDER_PRICING.totalPrice)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" role="form">
        {/* Email */}
        <div>
          <label htmlFor="customerEmail" className="block text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="customerEmail"
            value={formData.customerEmail}
            onChange={(e) => handleInputChange('customerEmail', e.target.value)}
            onBlur={handleEmailBlur}
            aria-describedby={showEmailError ? 'email-error' : undefined}
            className="w-full px-4 py-3 bg-bg-elevated border border-border-subtle rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
            placeholder="your@email.com"
          />
          {showEmailError && (
            <p id="email-error" className="mt-2 text-sm text-red-400">
              {emailError || errors.customerEmail}
            </p>
          )}
        </div>

        {/* Pixel Model Dropdown */}
        <div>
          <label htmlFor="pixelModel" className="block text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
            Pixel Model
          </label>
          <select
            id="pixelModel"
            value={formData.pixelModel}
            onChange={(e) => handleInputChange('pixelModel', e.target.value)}
            className="w-full px-4 py-3 bg-bg-elevated border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
          >
            <option value="">Select your Pixel model</option>
            {SUPPORTED_PIXEL_MODELS.map(model => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        {/* Return Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-display font-semibold text-text-primary">Return Address</h3>

          <div>
            <label htmlFor="fullName" className="block text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={formData.returnAddress.fullName}
              onChange={(e) => handleAddressChange('fullName', e.target.value)}
              className="w-full px-4 py-3 bg-bg-elevated border border-border-subtle rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="addressLine1" className="block text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
              Address Line 1
            </label>
            <input
              type="text"
              id="addressLine1"
              value={formData.returnAddress.addressLine1}
              onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
              className="w-full px-4 py-3 bg-bg-elevated border border-border-subtle rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
              placeholder="123 Street Name"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
              City
            </label>
            <input
              type="text"
              id="city"
              value={formData.returnAddress.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              className="w-full px-4 py-3 bg-bg-elevated border border-border-subtle rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
              placeholder="London"
            />
          </div>

          <div>
            <label htmlFor="stateProvince" className="block text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
              State/Province
            </label>
            <input
              type="text"
              id="stateProvince"
              value={formData.returnAddress.stateProvince}
              onChange={(e) => handleAddressChange('stateProvince', e.target.value)}
              className="w-full px-4 py-3 bg-bg-elevated border border-border-subtle rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
              placeholder="England"
            />
          </div>

          <div>
            <label htmlFor="postalCode" className="block text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
              Postal Code
            </label>
            <input
              type="text"
              id="postalCode"
              value={formData.returnAddress.postalCode}
              onChange={(e) => handleAddressChange('postalCode', e.target.value)}
              className="w-full px-4 py-3 bg-bg-elevated border border-border-subtle rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
              placeholder="E1 6AN"
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
              Country
            </label>
            <input
              type="text"
              id="country"
              value={formData.returnAddress.country}
              onChange={(e) => handleAddressChange('country', e.target.value)}
              className="w-full px-4 py-3 bg-bg-elevated border border-border-subtle rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={formData.returnAddress.phoneNumber}
              onChange={(e) => handleAddressChange('phoneNumber', e.target.value)}
              className="w-full px-4 py-3 bg-bg-elevated border border-border-subtle rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
              placeholder="+44 20 7946 0958"
            />
          </div>
        </div>

        {/* Factory Reset Confirmation */}
        <div className="p-4 bg-bg-elevated rounded-lg border border-border-subtle">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.factoryResetConfirmed}
              onChange={(e) => handleInputChange('factoryResetConfirmed', e.target.checked)}
              className="mt-1 w-5 h-5 text-cyan-400 bg-bg-card border-border-subtle rounded focus:ring-cyan-400 focus:ring-2"
            />
            <span className="text-sm text-text-secondary">
              I confirm that my device has been factory reset and all personal data has been removed.
              I understand that Graphene Security is not responsible for any data loss.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid() || isSubmitting}
          className="w-full py-4 px-6 bg-gradient-to-r from-cyan-400 to-matrix-400 text-text-on-accent font-heading font-bold text-sm uppercase tracking-wider rounded-lg hover:shadow-glow-cyan transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {isSubmitting ? 'Creating Order...' : 'Continue to Payment'}
        </button>
      </form>
    </div>
  );
};

export default FlashServiceForm;
