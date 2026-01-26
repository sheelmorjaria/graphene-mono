import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { useLogin } from '../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useLogin();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen px-4 py-12 flex items-center">
      <div className="max-w-md w-full mx-auto">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-cyan-400 mb-2 uppercase tracking-wider">
            Graphene Security
          </h1>
          <p className="text-text-secondary">
            Secure Sign In
          </p>
        </div>

        {/* Login Card */}
        <div className="card card-glow p-6 md:p-8 animate-fadeIn">
          <div className="text-center mb-6">
            <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
              Welcome Back
            </h2>
            <p className="text-text-muted text-sm">
              Sign in to access your account
            </p>
          </div>

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
                className="bg-red-subtle border border-red text-red px-4 py-3 rounded-md font-mono text-sm flex items-start gap-3"
              >
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

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
                  data-testid="email-input"
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
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  value={formData.password}
                  onChange={handleInputChange}
                  data-testid="password-input"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={`form-input pl-10 pr-10 ${errors.password ? 'form-input-error' : ''}`}
                  placeholder="•••••••••"
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
              {errors.password && (
                <p id="password-error" className="form-error">
                  {errors.password}
                </p>
              )}
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
                  className="w-4 h-4 text-cyan-400 focus:ring-2 focus:ring-cyan-400 border-border-default rounded bg-bg-elevated"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-text-secondary">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-mono text-cyan-400 hover:text-matrix-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              data-testid="login-button"
              className="btn btn-primary w-full btn-lg"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
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

          {/* Register Link */}
          <div className="text-center">
            <p className="text-text-secondary text-sm mb-2">
              Don't have an account?
            </p>
            <Link
              to="/register"
              className="btn btn-secondary w-full"
            >
              Create Account
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
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
                  <span className="text-cyan-400">Secure</span> login with end-to-end encryption. Your privacy is protected.
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
          <Link to="/faq" className="card p-4 text-center hover:border-cyan transition-colors group">
            <p className="text-cyan-400 text-xs font-mono mb-1">Help</p>
            <p className="text-text-secondary text-xs">FAQ</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
