import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/authService';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldError, setFieldError] = useState('');

  // Set page title
  useEffect(() => {
    document.title = 'Forgot Password - GrapheneOS Store';
  }, []);

  // Email validation
  const validateEmail = (email) => {
    if (!email.trim()) {
      return 'Email is required';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    
    return '';
  };

  // Handle input changes
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    // Clear errors when user starts typing
    if (fieldError) {
      setFieldError('');
    }
    if (error) {
      setError('');
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Handle field blur for validation
  const handleEmailBlur = () => {
    const validationError = validateEmail(email);
    setFieldError(validationError);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationError = validateEmail(email);
    if (validationError) {
      setFieldError(validationError);
      return;
    }

    // Prevent multiple submissions
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    setFieldError('');

    try {
      const response = await forgotPassword({ email: email.trim().toLowerCase() });
      
      if (response.success) {
        setSuccessMessage(response.message);
        setEmail(''); // Clear form after successful submission
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Forgot Password
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address *
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  aria-describedby={fieldError ? 'email-error' : undefined}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    fieldError ? 'border-red-300' : 'border-gray-300'
                  } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter your email address"
                />
                {fieldError && (
                  <p id="email-error" className="mt-2 text-sm text-red-600">
                    {fieldError}
                  </p>
                )}
              </div>
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
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>

            {/* Back to Login Link */}
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;