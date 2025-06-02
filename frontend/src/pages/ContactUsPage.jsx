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
    document.title = "Contact Us - GrapheneOS Store";
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
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) return "Email is required";
        if (!emailRegex.test(value))
          return "Please enter a valid email address";
        return "";
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
      const response = await submitContactForm(formData);

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
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-forest-100 px-4 py-8">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg border border-forest-200 p-8 transform transition-all duration-300 hover:shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-success"
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
              <h1 className="text-2xl font-bold text-forest-900 mb-4">
                Message Sent!
              </h1>
              <p className="text-forest-700 mb-6">
                Your message has been sent! We'll get back to you shortly.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="bg-forest-600 px-6 py-2 rounded-lg hover:bg-forest-700 transition-all duration-200 transform hover:scale-105"
              >
                Send Another Message
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-forest-100 px-4 py-8">
      <div className="container mx-auto">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg border border-forest-200 p-8 transform transition-all duration-300 hover:shadow-xl">
          <h1 className="text-3xl font-bold text-forest-900 mb-2">
            Contact Us
          </h1>
          <p className="text-forest-700 mb-8">
            Have a question or need help? We're here to assist you. Fill out the
            form below and we'll get back to you as soon as possible.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded">
                {errors.submit}
              </div>
            )}

            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-forest-700 mb-2"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 transition-colors placeholder-forest-400 ${
                  errors.fullName
                    ? "border-error/50 bg-error/10"
                    : "border-forest-300 hover:border-forest-400"
                }`}
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-error">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-forest-700 mb-2"
              >
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 transition-colors placeholder-forest-400 ${
                  errors.email
                    ? "border-error/50 bg-error/10"
                    : "border-forest-300 hover:border-forest-400"
                }`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-error">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-forest-700 mb-2"
              >
                Subject *
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 transition-colors ${
                  errors.subject
                    ? "border-error/50 bg-error/10"
                    : "border-forest-300 hover:border-forest-400"
                }`}
              >
                {subjectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.subject && (
                <p className="mt-1 text-sm text-error">{errors.subject}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="orderNumber"
                className="block text-sm font-medium text-forest-700 mb-2"
              >
                Order Number <span className="text-forest-500">(Optional)</span>
              </label>
              <input
                type="text"
                id="orderNumber"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-forest-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 transition-colors hover:border-forest-400 placeholder-forest-400"
                placeholder="Enter your order number if applicable"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-forest-700 mb-2"
              >
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                rows="6"
                value={formData.message}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 resize-vertical transition-colors placeholder-forest-400 ${
                  errors.message
                    ? "border-error/50 bg-error/10"
                    : "border-forest-300 hover:border-forest-400"
                }`}
                placeholder="Please describe your question or issue in detail..."
              />
              {errors.message && (
                <p className="mt-1 text-sm text-error">{errors.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-500 transition-all duration-200 ${
                isSubmitting
                  ? "bg-forest-400 cursor-not-allowed"
                  : "bg-forest-600 hover:bg-forest-700 transform hover:scale-105"
              }`}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
