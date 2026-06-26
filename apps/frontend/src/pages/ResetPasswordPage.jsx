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
    document.title = 'Reset Password - Graphene Security';
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
    <div className="min-h-screen bg-bg-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-bold text-cyan-400 uppercase tracking-wider animate-fadeIn">
          Reset Password
        </h1>
        <p className="mt-2 text-center text-sm text-text-secondary animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          Enter your new password below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card card-glow py-8 px-4 sm:rounded-lg sm:px-10 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <form role="form" className="space-y-6" onSubmit={handleSubmit}>
            {/* General Error Message */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-md p-4">
                <div className="text-sm text-red-400">{error}</div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-matrix-900/30 border border-matrix-400/50 rounded-md p-4">
                <div className="text-sm text-matrix-400">{successMessage}</div>
              </div>
            )}

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-text-primary">
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
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-text-muted focus:outline-none focus:ring-cyan-400 focus:border-cyan-400 sm:text-sm bg-bg-elevated text-text-primary ${
                    errors.newPassword ? 'border-red-400' : 'border-border-default'
                  } ${isLoading ? 'bg-bg-muted cursor-not-allowed' : ''}`}
                  placeholder="Enter your new password"
                />
                {errors.newPassword && (
                  <p id="newPassword-error" className="mt-2 text-sm text-red-400">
                    {errors.newPassword}
                  </p>
                )}

                {/* Password Requirements */}
                {showPasswordRequirements && (
                  <div id="newPassword-help" className="mt-2">
                    <p className="text-sm text-text-secondary mb-2">Password must contain:</p>
                    <ul className="text-xs text-text-muted space-y-1">
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
                      <span className="text-xs text-text-muted">Strength:</span>
                      <span className={`text-xs font-medium ${
                        getPasswordStrength()?.strength === 'weak' ? 'text-red-400' :
                        getPasswordStrength()?.strength === 'medium' ? 'text-yellow-400' :
                        'text-matrix-400'
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
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-text-primary">
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
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-text-muted focus:outline-none focus:ring-cyan-400 focus:border-cyan-400 sm:text-sm bg-bg-elevated text-text-primary ${
                    errors.confirmNewPassword ? 'border-red-400' : 'border-border-default'
                  } ${isLoading ? 'bg-bg-muted cursor-not-allowed' : ''}`}
                  placeholder="Confirm your new password"
                />
                {errors.confirmNewPassword && (
                  <p id="confirmNewPassword-error" className="mt-2 text-sm text-red-400">
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
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 ${
                  isLoading || !token
                    ? 'bg-bg-muted cursor-not-allowed'
                    : 'bg-cyan-500 hover:bg-cyan-600'
                }`}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>

            {/* Back to Login Link */}
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
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