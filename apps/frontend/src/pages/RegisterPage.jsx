import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';
import { useLogin } from '../contexts/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const login = useLogin();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    marketingOptIn: false
  });

  // Validation errors state
  const [errors, setErrors] = useState({});

  // Set page title
  useEffect(() => {
    document.title = 'Create Account - GrapheneOS Store';
  }, []);

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

  // Password strength validation
  const validatePasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const passed = Object.values(checks).filter(Boolean).length;
    
    return {
      checks,
      strength: passed < 3 ? 'weak' : passed < 5 ? 'medium' : 'strong',
      isValid: passed === 5
    };
  };

  // Get password strength for display
  const getPasswordStrength = () => {
    if (!formData.password) return null;
    return validatePasswordStrength(formData.password);
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

    // Clear general error
    if (error) {
      setError('');
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
      case 'password':
        if (value) {
          const { isValid } = validatePasswordStrength(value);
          if (!isValid) {
            fieldError = 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character';
          }
        }
        break;
      case 'confirmPassword':
        if (value && value !== formData.password) {
          fieldError = 'Passwords do not match';
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
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email address';

    if (!formData.password) newErrors.password = 'Password is required';
    else {
      const { isValid } = validatePasswordStrength(formData.password);
      if (!isValid) newErrors.password = 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character';
    }

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.confirmPassword !== formData.password) newErrors.confirmPassword = 'Passwords do not match';

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';

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

    try {
      const response = await registerUser(formData);
      
      if (response.success) {
        // Update global auth state
        login(response.data.user);
        // Navigate to products page on successful registration
        navigate('/products');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-forest-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-forest-900">
          Create Your Account
        </h1>
        <p className="mt-2 text-center text-sm text-forest-700">
          Or{' '}
          <Link
            to="/login"
            className="font-medium text-forest-600 hover:text-forest-700 transition-colors"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg border border-forest-200 sm:rounded-lg sm:px-10 transform transition-all duration-300 hover:shadow-xl">
          <form role="form" className="space-y-6" onSubmit={handleSubmit}>
            {/* General Error Message */}
            {error && (
              <div className="bg-error/10 border border-error/30 rounded-md p-4">
                <div className="text-sm text-error">{error}</div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-forest-700">
                Email Address *
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-forest-400 focus:outline-none focus:ring-forest-600 focus:border-forest-600 sm:text-sm transition-colors ${
                    errors.email ? 'border-error/50' : 'border-forest-300'
                  } ${isLoading ? 'bg-forest-100 cursor-not-allowed' : 'hover:border-forest-400'}`}
                  placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <p id="email-error" className="mt-2 text-sm text-error">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-forest-700">
                Password *
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  onFocus={() => setShowPasswordRequirements(true)}
                  aria-describedby={errors.password ? 'password-error' : 'password-help'}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-forest-400 focus:outline-none focus:ring-forest-600 focus:border-forest-600 sm:text-sm transition-colors ${
                    errors.password ? 'border-error/50' : 'border-forest-300'
                  } ${isLoading ? 'bg-forest-100 cursor-not-allowed' : 'hover:border-forest-400'}`}
                />
                {errors.password && (
                  <p id="password-error" className="mt-2 text-sm text-error">
                    {errors.password}
                  </p>
                )}
                
                {/* Password Requirements */}
                {showPasswordRequirements && (
                  <div id="password-help" className="mt-2">
                    <p className="text-sm text-forest-700 mb-2">Password must contain:</p>
                    <ul className="text-xs text-forest-600 space-y-1">
                      <li>• At least 8 characters</li>
                      <li>• One uppercase letter</li>
                      <li>• One lowercase letter</li>
                      <li>• One number</li>
                      <li>• One special character</li>
                    </ul>
                  </div>
                )}

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-forest-600">Strength:</span>
                      <span className={`text-xs font-medium ${
                        getPasswordStrength()?.strength === 'weak' ? 'text-error' :
                        getPasswordStrength()?.strength === 'medium' ? 'text-warning' :
                        'text-success'
                      }`}>
                        {getPasswordStrength()?.strength}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-forest-700">
                Confirm Password *
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-forest-400 focus:outline-none focus:ring-forest-600 focus:border-forest-600 sm:text-sm transition-colors ${
                    errors.confirmPassword ? 'border-error/50' : 'border-forest-300'
                  } ${isLoading ? 'bg-forest-100 cursor-not-allowed' : 'hover:border-forest-400'}`}
                />
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="mt-2 text-sm text-error">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-forest-700">
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
                  aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-forest-400 focus:outline-none focus:ring-forest-600 focus:border-forest-600 sm:text-sm transition-colors ${
                    errors.firstName ? 'border-error/50' : 'border-forest-300'
                  } ${isLoading ? 'bg-forest-100 cursor-not-allowed' : 'hover:border-forest-400'}`}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p id="firstName-error" className="mt-2 text-sm text-error">
                    {errors.firstName}
                  </p>
                )}
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-forest-700">
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
                  aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-forest-400 focus:outline-none focus:ring-forest-600 focus:border-forest-600 sm:text-sm transition-colors ${
                    errors.lastName ? 'border-error/50' : 'border-forest-300'
                  } ${isLoading ? 'bg-forest-100 cursor-not-allowed' : 'hover:border-forest-400'}`}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p id="lastName-error" className="mt-2 text-sm text-error">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-forest-700">
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
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-forest-400 focus:outline-none focus:ring-forest-600 focus:border-forest-600 sm:text-sm transition-colors ${
                    errors.phone ? 'border-error/50' : 'border-forest-300'
                  } ${isLoading ? 'bg-forest-100 cursor-not-allowed' : 'hover:border-forest-400'}`}
                  placeholder="+44 7123 456789"
                />
                {errors.phone && (
                  <p id="phone-error" className="mt-2 text-sm text-error">
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
                className="h-4 w-4 text-forest-600 focus:ring-forest-500 border-forest-300 rounded"
              />
              <label htmlFor="marketingOptIn" className="ml-2 block text-sm text-forest-800">
                I would like to receive marketing emails about new products and offers
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-500 transition-all duration-200 ${
                  isLoading
                    ? 'bg-forest-400 cursor-not-allowed'
                    : 'bg-forest-600 hover:bg-forest-700 transform hover:scale-105'
                }`}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center text-sm text-forest-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-forest-600 hover:text-forest-700 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;