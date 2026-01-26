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
    document.title = 'Forgot Password - Graphene Security';
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
    <div className="min-h-screen px-4 py-12 flex items-center">
      <div className="max-w-md w-full mx-auto">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-cyan-400 mb-2 uppercase tracking-wider">
            Graphene Security
          </h1>
          <p className="text-text-secondary">
            Password Recovery
          </p>
        </div>

        {/* Forgot Password Card */}
        <div className="card card-glow p-6 md:p-8 animate-fadeIn">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-cyan-subtle border border-cyan-400 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
              Forgot Password?
            </h2>
            <p className="text-text-muted text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form
            role="form"
            className="space-y-6"
            onSubmit={handleSubmit}
          >
            {/* General Error Message */}
            {error && (
              <div className="bg-red-subtle border border-red text-red px-4 py-3 rounded-md font-mono text-sm flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-matrix-subtle border border-matrix-400 text-text-primary px-4 py-3 rounded-md font-mono text-sm flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-matrix-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{successMessage}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="form-label">
                Email Address <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 4 4 4 0 008 8zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9 9 9 0 009 9zm-9 5.25h.008v.008H7v-.008H7v.008z" />
                  </svg>
                </div>
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
                  className={`form-input pl-10 ${fieldError ? 'form-input-error' : ''}`}
                  placeholder="your@email.com"
                />
              </div>
              {fieldError && (
                <p id="email-error" className="form-error">
                  {fieldError}
                </p>
              )}
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
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>

            {/* Back to Login Link */}
            <div className="text-center">
              <Link
                to="/login"
                className="text-cyan-400 hover:text-matrix-400 transition-colors font-mono text-sm"
              >
                <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to login
              </Link>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-border-subtle">
            <div className="flex items-start gap-3 text-text-muted text-xs">
              <svg className="w-5 h-5 text-matrix-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="flex-1">
                <p className="font-mono">
                  <span className="text-cyan-400">Secure</span> password reset. The link will expire in 1 hour for your security.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Link to="/privacy" className="card p-4 text-center hover:border-cyan-400 transition-colors group">
            <p className="text-cyan-400 text-xs font-mono mb-1">Privacy</p>
            <p className="text-text-secondary text-xs">Policy</p>
          </Link>
          <Link to="/faq" className="card p-4 text-center hover:border-cyan-400 transition-colors group">
            <p className="text-cyan-400 text-xs font-mono mb-1">Help</p>
            <p className="text-text-secondary text-xs">FAQ</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
