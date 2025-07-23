import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../services/authService';

const MyProfilePage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    marketingOptIn: false
  });

  // Validation errors state
  const [errors, setErrors] = useState({});

  // Set page title
  useEffect(() => {
    document.title = 'My Profile - GrapheneOS Store';
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  // Pre-fill form with user data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        marketingOptIn: user.marketingOptIn || false
      });
    }
  }, [user]);

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation
  const validatePhone = (phone) => {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear general error and success message
    if (error) {
      setError('');
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Handle field blur for validation
  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    let fieldError = '';

    switch (name) {
      case 'email':
        if (value && !validateEmail(value)) {
          fieldError = 'Please enter a valid email address';
        }
        break;
      case 'firstName':
        if (!value.trim()) {
          fieldError = 'First name is required';
        }
        break;
      case 'lastName':
        if (!value.trim()) {
          fieldError = 'Last name is required';
        }
        break;
      case 'phone':
        if (value && !validatePhone(value)) {
          fieldError = 'Please enter a valid phone number';
        }
        break;
      default:
        break;
    }

    if (fieldError) {
      setErrors(prev => ({
        ...prev,
        [name]: fieldError
      }));
    }
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email address';

    // Optional phone validation
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const updateData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || undefined,
        marketingOptIn: formData.marketingOptIn
      };

      const response = await updateUserProfile(updateData);
      
      if (response.success) {
        setSuccessMessage('Profile updated successfully');
        // The user data in the auth context will be updated via the response
      }
    } catch (err) {
      setError(err.message || 'Update failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">My Profile</h1>
            
            <form role="form" className="space-y-6" onSubmit={handleSubmit}>
              {/* General Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-sm text-red-600">{error}</div>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="text-sm text-green-600">{successMessage}</div>
                </div>
              )}

              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <div className="mt-1">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    disabled={isLoading}
                    value={formData.firstName}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p id="firstName-error" className="mt-2 text-sm text-red-600">
                      {errors.firstName}
                    </p>
                  )}
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <div className="mt-1">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    disabled={isLoading}
                    value={formData.lastName}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p id="lastName-error" className="mt-2 text-sm text-red-600">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email - Read only for now (changing email requires re-verification) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={true} // Disable email changes for now
                    value={formData.email}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 bg-gray-100 cursor-not-allowed sm:text-sm"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Contact support to change your email address
                  </p>
                </div>
              </div>

              {/* Phone (Optional) */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number (Optional)
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    disabled={isLoading}
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="+44 7123 456789"
                  />
                  {errors.phone && (
                    <p id="phone-error" className="mt-2 text-sm text-red-600">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Marketing Opt-in */}
              <div className="flex items-center">
                <input
                  id="marketingOptIn"
                  name="marketingOptIn"
                  type="checkbox"
                  disabled={isLoading}
                  checked={formData.marketingOptIn}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="marketingOptIn" className="ml-2 block text-sm text-gray-900">
                  I would like to receive marketing emails about new products and offers
                </label>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfilePage;