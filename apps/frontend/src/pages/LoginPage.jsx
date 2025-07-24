import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { useLogin } from '../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useLogin();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // Validation errors state
  const [errors, setErrors] = useState({});

  // Set page title
  useEffect(() => {
    document.title = 'Sign In - Graphene Security';
  }, []);

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
      const response = await loginUser({
        email: formData.email,
        password: formData.password
      });
      
      if (response.success) {
        // Update global auth state
        login(response.data.user);
        // Navigate to products page on successful login
        navigate('/products');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-forest-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-forest-900">
          Sign In to Your Account
        </h1>
        <p className="mt-2 text-center text-sm text-forest-700">
          Or{' '}
          <Link
            to="/register"
            className="font-medium text-forest-600 hover:text-forest-700 transition-colors"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg border border-forest-200 sm:rounded-lg sm:px-10 transform transition-all duration-300 hover:shadow-xl">
          <form 
            role="form" 
            data-testid="admin-login-form"
            className="space-y-6" 
            onSubmit={handleSubmit}
          >
            {/* General Error Message */}
            {error && (
              <div 
                data-testid="login-error"
                className="bg-error/10 border border-error/30 rounded-md p-4"
              >
                <div className="text-sm text-error">{error}</div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-forest-700">
                Email Address
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
                  data-testid="email-input"
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
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  value={formData.password}
                  onChange={handleInputChange}
                  data-testid="password-input"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-forest-400 focus:outline-none focus:ring-forest-600 focus:border-forest-600 sm:text-sm transition-colors ${
                    errors.password ? 'border-error/50' : 'border-forest-300'
                  } ${isLoading ? 'bg-forest-100 cursor-not-allowed' : 'hover:border-forest-400'}`}
                />
                {errors.password && (
                  <p id="password-error" className="mt-2 text-sm text-error">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  disabled={isLoading}
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-forest-600 focus:ring-forest-500 border-forest-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-forest-800">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-forest-600 hover:text-forest-700 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                data-testid="login-button"
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-500 transition-all duration-200 ${
                  isLoading
                    ? 'bg-forest-400 cursor-not-allowed'
                    : 'bg-forest-600 hover:bg-forest-700 transform hover:scale-105'
                }`}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center text-sm text-forest-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-forest-600 hover:text-forest-700 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;