import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';
import { useLogin } from '../contexts/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const login = useLogin();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  // Validation errors state
  const [errors, setErrors] = useState({});

  // Set page title
  useEffect(() => {
    document.title = 'Create Account - Graphene Security';
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
    <div className="min-h-screen px-4 py-12 flex items-center">
      <div className="max-w-md w-full mx-auto">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-cyan-400 mb-2 uppercase tracking-wider">
            Graphene Security
          </h1>
          <p className="text-text-secondary">
            Create Your Account
          </p>
        </div>

        {/* Register Card */}
        <div className="card card-glow p-6 md:p-8 animate-fadeIn">
          <div className="text-center mb-6">
            <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
              Join Our Community
            </h2>
            <p className="text-text-muted text-sm">
              Create an account for a better shopping experience
            </p>
          </div>

          <form role="form" className="space-y-6" onSubmit={handleSubmit}>
            {/* General Error Message */}
            {error && (
              <div className="bg-red-subtle border border-red text-red px-4 py-3 rounded-md font-mono text-sm flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Name Fields Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="form-label">
                  First Name <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 100-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
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
                    className={`form-input pl-10 ${errors.firstName ? 'form-input-error' : ''}`}
                    placeholder="John"
                  />
                </div>
                {errors.firstName && (
                  <p id="firstName-error" className="form-error">
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="form-label">
                  Last Name <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 100-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
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
                    className={`form-input pl-10 ${errors.lastName ? 'form-input-error' : ''}`}
                    placeholder="Doe"
                  />
                </div>
                {errors.lastName && (
                  <p id="lastName-error" className="form-error">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="form-label">
                Email Address <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 4 4 0 008 8zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9 9 0 009 9zm-9 5.25h.008v.008H7v-.008H7v.008z" />
                  </svg>
                </div>
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
                  className={`form-input pl-10 ${errors.email ? 'form-input-error' : ''}`}
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && (
                <p id="email-error" className="form-error">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="form-label">
                Password <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2m10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  onFocus={() => setShowPasswordRequirements(true)}
                  aria-describedby={errors.password ? 'password-error' : 'password-help'}
                  className={`form-input pl-10 pr-10 ${errors.password ? 'form-input-error' : ''}`}
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-cyan-400 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 5 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S4.478 19.057 3.732 14z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 5 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S4.478 19.057 3.732 14z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              {showPasswordRequirements && (
                <div id="password-help" className="mt-3">
                  <p className="text-text-secondary text-sm mb-2">Password must contain:</p>
                  <ul className="text-xs text-text-muted space-y-1 font-mono">
                    <li>• At least 8 characters</li>
                    <li>• One uppercase letter (A-Z)</li>
                    <li>• One lowercase letter (a-z)</li>
                    <li>• One number (0-9)</li>
                    <li>• One special character (!@#$%^&*(),.?":{}|&lt;&gt;)</li>
                  </ul>
                </div>
              )}

              {/* Password Strength Indicator */}
              {formData.password && (() => {
                const strength = getPasswordStrength()?.strength;
                const strengthLabel = strength
                  ? strength.charAt(0).toUpperCase() + strength.slice(1)
                  : '';
                return (
                  <div className="mt-3">
                    <div
                      className="flex items-center gap-2"
                      role="meter"
                      aria-valuemin={0}
                      aria-valuemax={3}
                      aria-valuenow={strength === 'weak' ? 1 : strength === 'medium' ? 2 : strength === 'strong' ? 3 : 0}
                      aria-valuetext={strengthLabel ? `Password strength: ${strengthLabel}` : undefined}
                      aria-label={strengthLabel ? `Password strength: ${strengthLabel}` : 'Password strength'}
                    >
                      <span className="text-xs text-text-muted font-mono">Strength:</span>
                      <div className="flex gap-1" aria-hidden="true">
                        {strength === 'weak' && (
                          <span className="w-8 h-1.5 rounded-full bg-red"></span>
                        )}
                        {strength === 'medium' && (
                          <>
                            <span className="w-8 h-1.5 rounded-full bg-amber"></span>
                            <span className="w-8 h-1.5 rounded-full bg-amber"></span>
                          </>
                        )}
                        {strength === 'strong' && (
                          <>
                            <span className="w-8 h-1.5 rounded-full bg-matrix-400"></span>
                            <span className="w-8 h-1.5 rounded-full bg-matrix-400"></span>
                            <span className="w-8 h-1.5 rounded-full bg-matrix-400"></span>
                            <span className="w-8 h-1.5 rounded-full bg-matrix-400"></span>
                            <span className="w-8 h-1.5 rounded-full bg-matrix-400"></span>
                          </>
                        )}
                      </div>
                      {strengthLabel && (
                        <span className="sr-only">{strengthLabel}</span>
                      )}
                    </div>
                  </div>
                );
              })()}
              {errors.password && (
                <p id="password-error" className="form-error">
                  {errors.password}
                </p>
 )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  className={`form-input pl-10 pr-10 ${errors.confirmPassword ? 'form-input-error' : ''}`}
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-cyan-400 transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 5 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S4.478 19.057 3.732 14z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 5 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7S4.478 19.057 3.732 14z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="form-error">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="phone" className="form-label">
                Phone Number <span className="text-text-muted">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h4a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2zm14 0a2 2 0 01-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
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
                  className={`form-input pl-10 ${errors.phone ? 'form-input-error' : ''}`}
                  placeholder="+44 7123 456789"
                />
              </div>
              {errors.phone && (
                <p id="phone-error" className="form-error">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Privacy Notice */}
            <div className="bg-cyan-subtle border border-cyan rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="text-xs">
                  <p className="font-mono text-cyan-400 mb-1">Privacy Notice:</p>
                  <p className="text-text-secondary">
                    Email addresses are not collected for marketing purposes. We use your email purely for authentication and transactional emails related to your account and orders.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full btn-lg"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4V5a4 4 0 00-4-4h-1m-1 0v11m0 0h6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-border-subtle"></div>
            <span className="px-4 text-text-muted text-sm font-mono">OR</span>
            <div className="flex-1 border-t border-border-subtle"></div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-text-secondary text-sm mb-2">
              Already have an account?
            </p>
            <Link
              to="/login"
              className="btn btn-secondary w-full"
            >
              Sign In
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4 4m0 0H5" />
              </svg>
            </Link>
          </div>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-border-subtle">
            <div className="flex items-start gap-3 text-text-muted text-xs">
              <svg className="w-5 h-5 text-matrix-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="flex-1">
                <p className="font-mono">
                  <span className="text-cyan-400">Secure</span> registration with end-to-end encryption. Your privacy is protected by our privacy policy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Link to="/privacy" className="card p-4 text-center hover:border-cyan transition-colors group">
            <p className="text-cyan-400 text-xs font-mono mb-1">Privacy</p>
            <p className="text-text-secondary text-xs">Policy</p>
          </Link>
          <Link to="/terms" className="card p-4 text-center hover:border-cyan transition-colors group">
            <p className="text-cyan-400 text-xs font-mono mb-1">Terms</p>
            <p className="text-text-secondary text-xs">of Service</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
