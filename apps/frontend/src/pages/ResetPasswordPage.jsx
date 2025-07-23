import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/authService';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [errors, setErrors] = useState({});

  // Set page title
  useEffect(() => {
    document.title = 'Reset Password - GrapheneOS Store';
  }, []);

  // Check for token
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

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
    if (!formData.newPassword) return null;
    return validatePasswordStrength(formData.newPassword);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
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
      case 'newPassword':
        if (value) {
          const { isValid } = validatePasswordStrength(value);
          if (!isValid) {
            fieldError = 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character';
          }
        }
        break;
      case 'confirmNewPassword':
        if (value && value !== formData.newPassword) {
          fieldError = 'Passwords do not match';
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
    if (!formData.newPassword.trim()) newErrors.newPassword = 'New password is required';
    else {
      const { isValid } = validatePasswordStrength(formData.newPassword);
      if (!isValid) newErrors.newPassword = 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character';
    }

    if (!formData.confirmNewPassword.trim()) newErrors.confirmNewPassword = 'Please confirm your new password';
    else if (formData.confirmNewPassword !== formData.newPassword) newErrors.confirmNewPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    // Prevent multiple submissions
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await resetPassword({
        token,
        newPassword: formData.newPassword,
        confirmNewPassword: formData.confirmNewPassword
      });
      
      if (response.success) {
        setSuccessMessage('Password has been reset successfully. Please login with your new password.');
        
        // Clear form
        setFormData({
          newPassword: '',
          confirmNewPassword: ''
        });

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Reset Password
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your new password below.
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

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password *
              </label>
              <div className="mt-1">
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  onFocus={() => setShowPasswordRequirements(true)}
                  aria-describedby={errors.newPassword ? 'newPassword-error' : 'newPassword-help'}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.newPassword ? 'border-red-300' : 'border-gray-300'
                  } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter your new password"
                />
                {errors.newPassword && (
                  <p id="newPassword-error" className="mt-2 text-sm text-red-600">
                    {errors.newPassword}
                  </p>
                )}
                
                {/* Password Requirements */}
                {showPasswordRequirements && (
                  <div id="newPassword-help" className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Password must contain:</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li>• At least 8 characters</li>
                      <li>• One uppercase letter</li>
                      <li>• One lowercase letter</li>
                      <li>• One number</li>
                      <li>• One special character</li>
                    </ul>
                  </div>
                )}

                {/* Password Strength Indicator */}
                {formData.newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Strength:</span>
                      <span className={`text-xs font-medium ${
                        getPasswordStrength()?.strength === 'weak' ? 'text-red-500' :
                        getPasswordStrength()?.strength === 'medium' ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {getPasswordStrength()?.strength}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password *
              </label>
              <div className="mt-1">
                <input
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  value={formData.confirmNewPassword}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  aria-describedby={errors.confirmNewPassword ? 'confirmNewPassword-error' : undefined}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.confirmNewPassword ? 'border-red-300' : 'border-gray-300'
                  } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Confirm your new password"
                />
                {errors.confirmNewPassword && (
                  <p id="confirmNewPassword-error" className="mt-2 text-sm text-red-600">
                    {errors.confirmNewPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || !token}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading || !token
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPasswordPage;