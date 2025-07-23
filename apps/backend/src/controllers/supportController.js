import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';
import emailService from '../services/emailService.js';
import Order from '../models/Order.js';

// Valid subject options for contact form
const VALID_SUBJECTS = ['order-inquiry', 'product-question', 'technical-issue', 'other'];

// Submit contact form
export const submitContactForm = async (req, res) => {
  try {
    const { fullName, email, subject, orderNumber, message } = req.body;

    // Server-side validation
    const validationErrors = [];

    // Validate required fields
    if (!fullName || !fullName.trim()) {
      validationErrors.push('Full name is required');
    }

    if (!email || !email.trim()) {
      validationErrors.push('Email is required');
    } else if (!validator.isEmail(email.trim())) {
      validationErrors.push('Please enter a valid email address');
    }

    if (!subject || !subject.trim()) {
      validationErrors.push('Subject is required');
    } else if (!VALID_SUBJECTS.includes(subject)) {
      validationErrors.push('Please select a valid subject');
    }

    if (!message || !message.trim()) {
      validationErrors.push('Message is required');
    }

    // Check for validation errors
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Sanitize input to prevent XSS
    const sanitizedData = {
      fullName: DOMPurify.sanitize(fullName.trim()),
      email: validator.normalizeEmail(email.trim()),
      subject: DOMPurify.sanitize(subject.trim()),
      orderNumber: orderNumber ? DOMPurify.sanitize(orderNumber.trim()) : '',
      message: DOMPurify.sanitize(message.trim())
    };

    // Optional: Validate order number if provided
    let orderValidation = null;
    if (sanitizedData.orderNumber) {
      try {
        const order = await Order.findOne({ orderNumber: sanitizedData.orderNumber });
        if (!order) {
          orderValidation = { valid: false, message: 'Order not found' };
        } else {
          orderValidation = { valid: true, order };
          // Optionally check if order belongs to the user if they're logged in
          // This would require authentication middleware to be added to this route
        }
      } catch (error) {
        console.error('Error validating order number:', error);
        // Don't fail the whole request if order validation fails
        orderValidation = { valid: false, message: 'Unable to validate order number' };
      }
    }

    // Prepare contact request data
    const contactRequest = {
      ...sanitizedData,
      submittedAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      orderValidation
    };

    // Route the support request (Option A: Send email to support team)
    try {
      await emailService.sendSupportRequestEmail(contactRequest);
    } catch (error) {
      console.error('Error sending support request email:', error);
      // Don't fail the request if email sending fails
    }

    // Send acknowledgment email to customer
    try {
      await emailService.sendContactAcknowledgmentEmail(sanitizedData);
    } catch (error) {
      console.error('Error sending acknowledgment email:', error);
      // Don't fail the request if acknowledgment email fails
    }

    // Log the contact request for internal tracking
    console.log('📞 Contact Form Submission:', {
      from: sanitizedData.email,
      subject: sanitizedData.subject,
      hasOrderNumber: !!sanitizedData.orderNumber,
      orderValid: orderValidation?.valid,
      timestamp: contactRequest.submittedAt
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. We\'ll get back to you shortly.',
      submittedAt: contactRequest.submittedAt
    });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to submit contact form. Please try again later.'
    });
  }
};