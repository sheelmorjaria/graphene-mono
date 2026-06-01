import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { submitContactForm } from "../services/supportService";

const ContactUsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    orderNumber: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const subjectOptions = [
    { value: "", label: "Select a subject" },
    { value: "order-inquiry", label: "Order Inquiry" },
    { value: "product-question", label: "Product Question" },
    { value: "technical-issue", label: "Technical Issue" },
    { value: "other", label: "Other" },
  ];

  useEffect(() => {
    document.title = "Contact Us - Graphene Security";
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
      }));
    }
  }, [isAuthenticated, user]);

  const validateField = (name, value) => {
    switch (name) {
      case "fullName":
        return value.trim() ? "" : "Full name is required";
      case "email": {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) return "Email is required";
        if (!emailRegex.test(value))
          return "Please enter a valid email address";
        return "";
      }
      case "subject":
        return value ? "" : "Please select a subject";
      case "message":
        return value.trim() ? "" : "Message is required";
      default:
        return "";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (key !== "orderNumber") {
        // orderNumber is optional
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      }
    });
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const _response = await submitContactForm(formData);

      setIsSubmitted(true);
      setFormData({
        fullName:
          isAuthenticated && user ? `${user.firstName} ${user.lastName}` : "",
        email: isAuthenticated && user ? user.email : "",
        subject: "",
        orderNumber: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting contact form:", error);

      // Handle specific error responses
      if (error.message && error.message.includes("rate limit")) {
        setErrors({
          submit: "Too many submissions. Please wait before trying again.",
        });
      } else if (error.message && error.message.includes("Validation failed")) {
        setErrors({ submit: "Please check your input and try again." });
      } else {
        setErrors({ submit: "Failed to send message. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="card card-glow p-8 text-center animate-fadeIn">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-matrix-subtle border border-matrix flex items-center justify-center shadow-glow-matrix">
              <svg
                className="w-10 h-10 text-matrix-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {/* Success Message */}
            <h1 className="font-display text-2xl font-bold text-cyan-400 mb-3 uppercase tracking-wider">
              Message Sent!
            </h1>
            <p className="text-text-secondary mb-8">
              Your message has been sent! We'll get back to you shortly.
            </p>

            {/* Action Button */}
            <button
              onClick={() => setIsSubmitted(false)}
              className="btn btn-primary w-full"
            >
              <span>Send Another Message</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-cyan-400 mb-4 uppercase tracking-wider">
            Contact Us
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Have a question or need help? We're here to assist you. Fill out the
            form below and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Contact Form */}
        <div className="card card-glow p-6 md:p-8 animate-fadeIn">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {errors.submit && (
              <div className="bg-red-subtle border border-red text-red px-4 py-3 rounded-md font-mono text-sm flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{errors.submit}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="form-label"
              >
                Full Name <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`form-input ${errors.fullName ? 'form-input-error' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="form-error">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="form-label"
              >
                Email Address <span className="text-cyan-400">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="form-error">{errors.email}</p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label
                htmlFor="subject"
                className="form-label"
              >
                Subject <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className={`form-select appearance-none ${errors.subject ? 'form-input-error' : ''}`}
                >
                  {subjectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.subject && (
                <p className="form-error">{errors.subject}</p>
              )}
            </div>

            {/* Order Number */}
            <div>
              <label
                htmlFor="orderNumber"
                className="form-label"
              >
                Order Number <span className="text-text-muted">(Optional)</span>
              </label>
              <input
                type="text"
                id="orderNumber"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your order number if applicable"
              />
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="message"
                className="form-label"
              >
                Message <span className="text-cyan-400">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows="6"
                value={formData.message}
                onChange={handleInputChange}
                className={`form-textarea resize-vertical ${errors.message ? 'form-input-error' : ''}`}
                placeholder="Please describe your question or issue in detail..."
              />
              {errors.message && (
                <p className="form-error">{errors.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full btn-lg"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send Message</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Additional Contact Info */}
          <div className="mt-8 pt-6 border-t border-border-subtle">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-cyan-subtle flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-mono text-sm text-text-secondary">Email Support</p>
                <p className="text-xs text-text-muted mt-1">contact@graphene-security.com</p>
              </div>
              <div className="p-4">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-matrix-subtle flex items-center justify-center">
                  <svg className="w-5 h-5 text-matrix-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-mono text-sm text-text-secondary">Response Time</p>
                <p className="text-xs text-text-muted mt-1">Within 24 hours</p>
              </div>
              <div className="p-4">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-pink-subtle flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="font-mono text-sm text-text-secondary">Secure & Private</p>
                <p className="text-xs text-text-muted mt-1">End-to-end encrypted</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
