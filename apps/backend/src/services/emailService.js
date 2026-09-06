import dotenv from 'dotenv';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { fromEnv } from '@aws-sdk/credential-providers';
import validator from 'validator';
import logger, { logError } from '../utils/logger.js';
import EmailPreference from '../models/EmailPreference.js';
import User from '../models/User.js';
import EmailMetrics from '../models/EmailMetrics.js';

// Ensure environment variables are loaded
dotenv.config();

class EmailService {
  constructor() {
    this.sesClient = null;
    this.isEnabled = false;
    this.initializeSES();
  }

  // Initialize AWS SES client
  initializeSES() {
    try {
      if (process.env.EMAIL_SERVICE === 'ses') {
        // Configure SES client
        const config = {
          region: process.env.AWS_REGION || 'us-east-1',
          credentials: fromEnv()
        };

        // Allow endpoint override for testing
        if (process.env.AWS_SES_ENDPOINT) {
          config.endpoint = process.env.AWS_SES_ENDPOINT;
        }

        this.sesClient = new SESClient(config);
        this.isEnabled = true;
        logger.info('AWS SES email service initialized');
      } else {
        // Only log if EMAIL_SERVICE is explicitly set to something other than 'ses'
        if (process.env.EMAIL_SERVICE && process.env.EMAIL_SERVICE !== 'ses') {
          logger.info(`Email service set to '${process.env.EMAIL_SERVICE}' - using mock mode`);
        } else if (!process.env.EMAIL_SERVICE) {
          logger.info('EMAIL_SERVICE not set - using mock mode');
        }
      }
    } catch (error) {
      logError(error, { context: 'email_service_initialization' });
      this.sesClient = null;
      this.isEnabled = false;
    }
  }

  // Verify email configuration
  async verifyConnection() {
    if (!this.isEnabled || !this.sesClient) {
      return { success: false, error: 'Email service not initialized' };
    }

    try {
      // This will validate credentials and configuration
      await this.sesClient.config.credentials();
      
      return { success: true, message: 'AWS SES connection verified' };
    } catch (error) {
      logError(error, { context: 'email_verification' });
      return { success: false, error: error.message };
    }
  }

  // Validate email address
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, reason: 'Email is required' };
    }
    
    const trimmedEmail = email.trim();
    
    if (!validator.isEmail(trimmedEmail)) {
      return { isValid: false, reason: 'Invalid email format' };
    }
    
    // Additional validation rules
    const domain = trimmedEmail.split('@')[1];
    const blockedDomains = ['tempmail.com', 'throwaway.email', 'guerrillamail.com'];
    
    if (blockedDomains.includes(domain)) {
      return { isValid: false, reason: 'Temporary email addresses not allowed' };
    }
    
    return { isValid: true, email: validator.normalizeEmail(trimmedEmail) };
  }

  // Check if email can be sent based on preferences and status
  async canSendEmail(to, emailType = 'transactional.general') {
    try {
      // Find user and preferences
      const user = await User.findOne({ email: to });
      if (!user) {
        // Email not in our system - can send
        return { canSend: true };
      }
      
      const emailPref = await EmailPreference.findOne({ userId: user._id });
      if (!emailPref) {
        // No preferences set - can send
        return { canSend: true };
      }
      
      // Check if email is bounced or complained
      if (emailPref.emailStatus.isBounced || emailPref.emailStatus.isComplained) {
        return { 
          canSend: false, 
          reason: emailPref.emailStatus.isBounced ? 'Email address has bounced' : 'Email address has complained' 
        };
      }
      
      // Check preferences for email type
      const canSend = emailPref.canSendEmail(emailType);
      
      return {
        canSend,
        reason: canSend ? null : 'User has unsubscribed from this email type',
        unsubscribeToken: emailPref.unsubscribeToken
      };
      
    } catch (error) {
      logError(error, { context: 'can_send_email_check', to, emailType });
      // On error, default to sending
      return { canSend: true };
    }
  }

  // Send email with template
  async sendEmail({ to, subject, htmlContent, textContent, from = null, emailType = 'transactional.general', skipPreferenceCheck = false }) {
    const metrics = null;
    
    try {
      // Ensure SES is initialized before sending (handles race condition with dotenv loading)
      if (!this.isEnabled && process.env.EMAIL_SERVICE === 'ses') {
        logger.info('Re-initializing email service with loaded environment...');
        this.initializeSES();
      }
      // Validate email address
      const validation = this.validateEmail(to);
      if (!validation.isValid) {
        logger.warn('Invalid email address:', { to, reason: validation.reason });
        return { success: false, error: validation.reason };
      }
      
      const normalizedEmail = validation.email;
      
      // Check email preferences unless skipped (for critical transactional emails)
      if (!skipPreferenceCheck) {
        const canSendCheck = await this.canSendEmail(normalizedEmail, emailType);
        if (!canSendCheck.canSend) {
          logger.info('Email blocked by preferences:', { 
            to: normalizedEmail, 
            emailType, 
            reason: canSendCheck.reason 
          });
          return { 
            success: false, 
            error: canSendCheck.reason,
            blocked: true 
          };
        }
        
        // Add unsubscribe token to context for template
        if (canSendCheck.unsubscribeToken && !emailType.startsWith('transactional.')) {
          // Will be used to add unsubscribe link
          htmlContent = this.addUnsubscribeLink(htmlContent, canSendCheck.unsubscribeToken, emailType);
        }
      }
      
      // If service is disabled, log and return mock response
      if (!this.isEnabled || !this.sesClient) {
        logger.debug('Mock Email (No SES Client):', {
          to,
          subject,
          from: from || `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
          content: htmlContent || textContent
        });
        
        return {
          success: true,
          messageId: `mock_${Date.now()}`,
          message: 'Email logged (mock mode)'
        };
      }

      // Prepare email parameters for SES
      const params = {
        Source: from || `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        Destination: {
          ToAddresses: Array.isArray(to) ? to : [to]
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8'
          },
          Body: {}
        }
      };

      // Add HTML body if provided
      if (htmlContent) {
        params.Message.Body.Html = {
          Data: htmlContent,
          Charset: 'UTF-8'
        };
      }

      // Add text body if provided
      if (textContent) {
        params.Message.Body.Text = {
          Data: textContent,
          Charset: 'UTF-8'
        };
      }

      // If neither HTML nor text content is provided, use text
      if (!htmlContent && !textContent) {
        params.Message.Body.Text = {
          Data: 'No content provided',
          Charset: 'UTF-8'
        };
      }

      // Create metrics entry before sending
      const metrics = await EmailMetrics.create({
        messageId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        emailType: emailType,
        recipient: normalizedEmail,
        subject: subject,
        status: 'pending'
      });

      // Send email via SES
      const command = new SendEmailCommand(params);
      const result = await this.sesClient.send(command);
      
      // Update metrics with success
      metrics.metadata.sesMessageId = result.MessageId;
      metrics.status = 'sent';
      await metrics.recordEvent('sent', { sesMessageId: result.MessageId });
      
      logger.info('Email sent successfully via AWS SES:', {
        to,
        subject,
        messageId: result.MessageId,
        metricsId: metrics._id
      });

      return {
        success: true,
        messageId: result.MessageId,
        metricsId: metrics._id,
        message: 'Email sent successfully'
      };

    } catch (error) {
      logError(error, { context: 'email_send', to, subject });
      
      // Record failure in metrics if metrics was created
      if (metrics) {
        await metrics.recordEvent('failed', { error: error.message });
      }
      
      // Provide helpful error messages for common SES issues
      let errorMessage = error.message;
      if (error.name === 'MessageRejected') {
        errorMessage = 'Email rejected by AWS SES. Check if sender email is verified.';
      } else if (error.name === 'MailFromDomainNotVerifiedException') {
        errorMessage = 'Sender email domain not verified in AWS SES.';
      } else if (error.name === 'ConfigurationSetDoesNotExistException') {
        errorMessage = 'AWS SES configuration set does not exist.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Add unsubscribe link to HTML content
  addUnsubscribeLink(htmlContent, unsubscribeToken, emailType) {
    const baseUrl = process.env.FRONTEND_URL || 'https://graphene-security.com';
    const category = emailType.split('.')[0];
    
    const unsubscribeHtml = `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(0, 212, 255, 0.15); text-align: center; font-size: 12px; color: #8a96a3;">
        <p>
          You received this email because you're subscribed to ${category} emails from Graphene Security.
        </p>
        <p>
          <a href="${baseUrl}/api/webhook/unsubscribe/${unsubscribeToken}?category=${category}" 
             style="color: #00d4ff; text-decoration: underline;">
            Unsubscribe from ${category} emails
          </a>
          |
          <a href="${baseUrl}/api/webhook/unsubscribe/${unsubscribeToken}?all=true" 
             style="color: #00d4ff; text-decoration: underline;">
            Unsubscribe from all emails
          </a>
          |
          <a href="${baseUrl}/profile/email-preferences" 
             style="color: #00d4ff; text-decoration: underline;">
            Manage email preferences
          </a>
        </p>
      </div>
    `;
    
    // Insert before closing body tag
    return htmlContent.replace('</body>', `${unsubscribeHtml}</body>`);
  }

  // Generate HTML email template base
  generateEmailTemplate(title, content, customerName = 'Valued Customer', includeUnsubscribe = false, unsubscribeToken = null) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #d1d5db;
          margin: 0;
          padding: 0;
          background-color: #0a0a0a;
          -webkit-text-size-adjust: 100%;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #0d0d0d;
          border: 1px solid rgba(0, 212, 255, 0.25);
          border-radius: 10px;
          box-shadow: 0 0 24px rgba(0, 212, 255, 0.12);
          overflow: hidden;
        }
        .header {
          background-color: #0a0a0a;
          background-image: linear-gradient(135deg, rgba(0, 212, 255, 0.14) 0%, rgba(0, 255, 65, 0.08) 100%);
          border-bottom: 1px solid rgba(0, 212, 255, 0.3);
          color: #00d4ff;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #00d4ff;
        }
        .content {
          padding: 30px 20px;
          color: #d1d5db;
        }
        .content h2 {
          color: #00d4ff;
          font-size: 20px;
          margin-bottom: 20px;
        }
        .order-details {
          background-color: #141414;
          padding: 20px;
          margin: 20px 0;
          border-radius: 6px;
          border-left: 4px solid #00d4ff;
        }
        .order-details h3 {
          margin: 0 0 15px 0;
          color: #e5e7eb;
          font-size: 16px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .detail-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .detail-label {
          font-weight: 600;
          color: #8a96a3;
          font-size: 13px;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }
        .detail-value {
          color: #e5e7eb;
        }
        .highlight {
          color: #00d4ff;
          font-weight: bold;
        }
        .success {
          color: #00ff41;
          font-weight: bold;
        }
        .warning {
          color: #ff4d4d;
          font-weight: bold;
        }
        .footer {
          background-color: #0a0a0a;
          padding: 20px;
          text-align: center;
          border-top: 1px solid rgba(0, 212, 255, 0.15);
        }
        .footer p {
          margin: 5px 0;
          color: #8a96a3;
          font-size: 14px;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background-color: #00d4ff;
          background-image: linear-gradient(135deg, #00d4ff 0%, #00ff41 100%);
          color: #0a0a0a;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin: 20px 0;
        }
        .items-list {
          margin: 15px 0;
        }
        .item {
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .item:last-child {
          border-bottom: none;
        }
        a {
          color: #00d4ff;
        }
        ul {
          padding-left: 20px;
          margin: 10px 0;
        }
        li {
          margin-bottom: 6px;
          color: #c7cdd4;
        }
        .important-notice {
          background-color: rgba(0, 255, 65, 0.06);
          border: 1px solid rgba(0, 255, 65, 0.25);
          border-radius: 6px;
          padding: 16px 20px;
          margin: 20px 0;
        }
        .important-notice h3 {
          margin: 0 0 10px 0;
          color: #00ff41;
          font-size: 16px;
        }
        @media (max-width: 600px) {
          .email-container {
            margin: 10px;
            border-radius: 0;
          }
          .header, .content, .footer {
            padding: 20px 15px;
          }
          .detail-row {
            flex-direction: column;
          }
          .detail-label {
            margin-bottom: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          <p>Dear ${customerName},</p>
          ${content}
        </div>
        <div class="footer">
          <p><strong>Graphene Security</strong></p>
          <p>Privacy-focused smartphones and services</p>
          <p>Need help? Contact us at <a href="mailto:${process.env.SUPPORT_EMAIL}">${process.env.SUPPORT_EMAIL}</a></p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Send order confirmation email
  async sendOrderConfirmationEmail(order) {
    try {
      const itemsHtml = order.items.map(item => `
        <div class="item">
          <strong>${item.productName}</strong><br>
          Quantity: ${item.quantity} × £${item.unitPrice.toFixed(2)} = £${item.totalPrice.toFixed(2)}
        </div>
      `).join('');

      const content = `
        <p>Thank you for your order! We're excited to process your GrapheneOS device.</p>
        
        <div class="order-details">
          <h3>Order Details</h3>
          <div class="detail-row">
            <span class="detail-label">Order Number:</span>
            <span class="detail-value highlight">${order.orderNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Order Date:</span>
            <span class="detail-value">${new Date(order.orderDate || order.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total Amount:</span>
            <span class="detail-value success">£${order.totalAmount.toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-value">${order.paymentMethod?.name || 'N/A'}</span>
          </div>
        </div>

        <div class="order-details">
          <h3>Items Ordered</h3>
          <div class="items-list">
            ${itemsHtml}
          </div>
        </div>

        <div class="order-details">
          <h3>Shipping Address</h3>
          <p>
            ${order.shippingAddress.fullName}<br>
            ${order.shippingAddress.addressLine1}<br>
            ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
            ${order.shippingAddress.city}, ${order.shippingAddress.stateProvince}<br>
            ${order.shippingAddress.postalCode}<br>
            ${order.shippingAddress.country}
          </p>
        </div>

        <p>We'll send you another email when your order ships with tracking information.</p>
      `;

      const htmlContent = this.generateEmailTemplate(
        'Order Confirmation',
        content,
        order.shippingAddress.fullName || 'Valued Customer'
      );

      return await this.sendEmail({
        to: order.customerEmail,
        subject: `Order Confirmation - ${order.orderNumber}`,
        htmlContent
      });

    } catch (error) {
      logError(error, { context: 'order_confirmation_email', orderId: order._id });
      return { success: false, error: error.message };
    }
  }

  // Send order cancellation email
  async sendOrderCancellationEmail(order, refundDetails = null) {
    try {
      const refundSection = refundDetails ? `
        <div class="order-details">
          <h3>Refund Information</h3>
          <div class="detail-row">
            <span class="detail-label">Refund Amount:</span>
            <span class="detail-value success">£${(refundDetails.amount || 0).toFixed(2)}</span>
          </div>
          ${refundDetails.refundId ? `
          <div class="detail-row">
            <span class="detail-label">Refund ID:</span>
            <span class="detail-value">${refundDetails.refundId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Processing Time:</span>
            <span class="detail-value">5-10 business days</span>
          </div>
          ` : `
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">Your refund is being processed by our support team — we will contact you shortly.</span>
          </div>
          `}
        </div>
      ` : '';

      const content = `
        <p>Your order has been successfully cancelled as requested.</p>
        
        <div class="order-details">
          <h3>Cancelled Order Details</h3>
          <div class="detail-row">
            <span class="detail-label">Order Number:</span>
            <span class="detail-value highlight">${order.orderNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Order Date:</span>
            <span class="detail-value">${new Date(order.orderDate || order.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Order Total:</span>
            <span class="detail-value">£${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        ${refundSection}

        <p>We're sorry to see you cancel your order. If you have any questions or would like to place a new order, please don't hesitate to contact us.</p>
      `;

      const htmlContent = this.generateEmailTemplate(
        'Order Cancellation Confirmation',
        content,
        order.shippingAddress?.fullName || 'Valued Customer'
      );

      return await this.sendEmail({
        to: order.customerEmail,
        subject: `Order Cancellation Confirmation - ${order.orderNumber}`,
        htmlContent
      });

    } catch (error) {
      logError(error, { context: 'order_cancellation_email', orderId: order._id });
      return { success: false, error: error.message };
    }
  }

  // Send order shipped email
  async sendOrderShippedEmail(order) {
    try {
      const trackingSection = order.trackingNumber ? `
        <div class="order-details">
          <h3>Tracking Information</h3>
          <div class="detail-row">
            <span class="detail-label">Tracking Number:</span>
            <span class="detail-value highlight">${order.trackingNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Carrier:</span>
            <span class="detail-value">${order.shippingMethod?.name || 'Standard Shipping'}</span>
          </div>
          ${order.trackingUrl ? `
          <div class="detail-row">
            <span class="detail-label">Track Package:</span>
            <span class="detail-value"><a href="${order.trackingUrl}" class="highlight">Track Your Package</a></span>
          </div>
          ` : ''}
        </div>
      ` : '';

      const content = `
        <p>Great news! Your order has been shipped and is on its way to you.</p>
        
        <div class="order-details">
          <h3>Order Details</h3>
          <div class="detail-row">
            <span class="detail-label">Order Number:</span>
            <span class="detail-value highlight">${order.orderNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ship Date:</span>
            <span class="detail-value">${new Date().toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Estimated Delivery:</span>
            <span class="detail-value">${order.shippingMethod?.estimatedDelivery || '3-5 business days'}</span>
          </div>
        </div>

        ${trackingSection}

        <p>Your GrapheneOS device has been carefully prepared and is now en route. You'll receive another notification when it's delivered.</p>
      `;

      const htmlContent = this.generateEmailTemplate(
        'Your Order Has Shipped',
        content,
        order.shippingAddress?.fullName || order.customer?.firstName || 'Valued Customer'
      );

      return await this.sendEmail({
        to: order.customerEmail || order.customer?.email,
        subject: `Your Order Has Shipped - ${order.orderNumber}`,
        htmlContent
      });

    } catch (error) {
      logError(error, { context: 'order_shipped_email', orderId: order._id });
      return { success: false, error: error.message };
    }
  }

  // Send order delivered email
  async sendOrderDeliveredEmail(order) {
    try {
      const content = `
        <p>Excellent! Your order has been successfully delivered.</p>
        
        <div class="order-details">
          <h3>Delivery Confirmation</h3>
          <div class="detail-row">
            <span class="detail-label">Order Number:</span>
            <span class="detail-value highlight">${order.orderNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Delivered On:</span>
            <span class="detail-value success">${new Date().toLocaleDateString()}</span>
          </div>
          ${order.trackingNumber ? `
          <div class="detail-row">
            <span class="detail-label">Tracking Number:</span>
            <span class="detail-value">${order.trackingNumber}</span>
          </div>
          ` : ''}
        </div>

        <p>We hope you enjoy your new GrapheneOS device! If you have any questions about setup or need technical support, our team is here to help.</p>
      `;

      const htmlContent = this.generateEmailTemplate(
        'Order Delivered Successfully',
        content,
        order.shippingAddress?.fullName || order.customer?.firstName || 'Valued Customer'
      );

      return await this.sendEmail({
        to: order.customerEmail || order.customer?.email,
        subject: `Order Delivered - ${order.orderNumber}`,
        htmlContent
      });

    } catch (error) {
      logError(error, { context: 'order_delivered_email', orderId: order._id });
      return { success: false, error: error.message };
    }
  }

  // Send generic order status update email (processing/awaiting_shipment/
  // cancelled/returned — shipped and delivered have dedicated emails above).
  async sendOrderStatusUpdateEmail(order, newStatus, oldStatus = 'unknown') {
    try {
      const statusMessages = {
        processing: 'We are currently preparing your order. You will receive another email once it ships.',
        awaiting_shipment: 'Your order has been prepared and is awaiting dispatch. You will receive tracking details once it ships.',
        cancelled: 'Your order has been cancelled. If you believe you were charged in error or have any questions about a refund, please contact our support team.',
        returned: 'Your return has been recorded against this order. Our team will be in touch if any further information is needed.'
      };

      const statusMessage = statusMessages[newStatus] ||
        `The status of your order has been updated to "${newStatus}".`;

      const content = `
        <p>${statusMessage}</p>

        <div class="order-details">
          <h3>Order Details</h3>
          <div class="detail-row">
            <span class="detail-label">Order Number:</span>
            <span class="detail-value highlight">${order.orderNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Previous Status:</span>
            <span class="detail-value">${oldStatus}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Current Status:</span>
            <span class="detail-value highlight">${newStatus}</span>
          </div>
          ${order.trackingNumber ? `
          <div class="detail-row">
            <span class="detail-label">Tracking Number:</span>
            <span class="detail-value">${order.trackingNumber}</span>
          </div>
          ` : ''}
        </div>

        <p>If you have any questions, just reply to this email or contact our support team.</p>
      `;

      const htmlContent = this.generateEmailTemplate(
        'Order Status Update',
        content,
        order.shippingAddress?.fullName || order.customer?.firstName || 'Valued Customer'
      );

      return await this.sendEmail({
        to: order.customerEmail || order.customer?.email,
        subject: `Order Status Update - ${order.orderNumber}`,
        htmlContent
      });

    } catch (error) {
      logError(error, { context: 'order_status_update_email', orderId: order._id });
      return { success: false, error: error.message };
    }
  }

  // Send support request email to team
  async sendSupportRequestEmail(contactRequest) {
    try {
      const subjectMap = {
        'order-inquiry': 'Order Inquiry',
        'product-question': 'Product Question',
        'technical-issue': 'Technical Issue',
        'other': 'General Inquiry'
      };

      const content = `
        <div class="order-details">
          <h3>Contact Request Details</h3>
          <div class="detail-row">
            <span class="detail-label">Customer Name:</span>
            <span class="detail-value">${contactRequest.fullName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value"><a href="mailto:${contactRequest.email}">${contactRequest.email}</a></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Subject:</span>
            <span class="detail-value">${subjectMap[contactRequest.subject] || contactRequest.subject}</span>
          </div>
          ${contactRequest.orderNumber ? `
          <div class="detail-row">
            <span class="detail-label">Order Number:</span>
            <span class="detail-value highlight">${contactRequest.orderNumber}</span>
          </div>
          ` : ''}
          <div class="detail-row">
            <span class="detail-label">Submitted:</span>
            <span class="detail-value">${new Date(contactRequest.submittedAt).toLocaleString()}</span>
          </div>
        </div>

        <div class="order-details">
          <h3>Customer Message</h3>
          <p style="white-space: pre-line; margin: 0;">${contactRequest.message}</p>
        </div>

        ${contactRequest.orderValidation ? `
        <div class="order-details">
          <h3>Order Validation</h3>
          <p>Order validation: <span class="success">Verified</span></p>
        </div>
        ` : ''}
      `;

      const htmlContent = this.generateEmailTemplate(
        `Support Request - ${subjectMap[contactRequest.subject]}`,
        content,
        'Support Team'
      );

      return await this.sendEmail({
        to: process.env.SUPPORT_EMAIL,
        subject: `[Contact Form] ${subjectMap[contactRequest.subject]} - ${contactRequest.fullName}`,
        htmlContent
      });

    } catch (error) {
      logError(error, { context: 'support_request_email', contactRequest });
      return { success: false, error: error.message };
    }
  }

  // Send contact acknowledgment email to customer
  async sendContactAcknowledgmentEmail(contactData) {
    try {
      const content = `
        <p>Thank you for contacting Graphene Security support. We have received your message and will respond as soon as possible.</p>
        
        <div class="order-details">
          <h3>Your Request</h3>
          <div class="detail-row">
            <span class="detail-label">Subject:</span>
            <span class="detail-value">${contactData.subject}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Submitted:</span>
            <span class="detail-value">${new Date().toLocaleString()}</span>
          </div>
        </div>

        <div class="order-details">
          <h3>Your Message</h3>
          <p style="white-space: pre-line; margin: 0;">${contactData.message}</p>
        </div>

        <p>Our support team typically responds within 24 hours during business days. If your inquiry is urgent, please mention it in your message.</p>
      `;

      const htmlContent = this.generateEmailTemplate(
        'Support Request Received',
        content,
        contactData.fullName
      );

      return await this.sendEmail({
        to: contactData.email,
        subject: 'We received your message - Graphene Security Support',
        htmlContent
      });

    } catch (error) {
      logError(error, { context: 'contact_acknowledgment_email', contactData });
      return { success: false, error: error.message };
    }
  }

  // Send return request confirmation email
  async sendReturnRequestConfirmationEmail(returnRequest, order) {
    try {
      const itemsHtml = returnRequest.items.map(item => `
        <div class="item">
          <strong>${item.productName}</strong><br>
          Quantity: ${item.quantity}<br>
          Reason: ${item.reason}<br>
          Refund Amount: £${item.refundAmount.toFixed(2)}
        </div>
      `).join('');

      const content = `
        <p>Your return request has been received and is being processed.</p>
        
        <div class="order-details">
          <h3>Return Request Details</h3>
          <div class="detail-row">
            <span class="detail-label">Return Number:</span>
            <span class="detail-value highlight">${returnRequest.formattedRequestNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Original Order:</span>
            <span class="detail-value">${order.orderNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Request Date:</span>
            <span class="detail-value">${new Date(returnRequest.requestDate).toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total Refund Amount:</span>
            <span class="detail-value success">£${returnRequest.totalRefundAmount.toFixed(2)}</span>
          </div>
        </div>

        <div class="order-details">
          <h3>Items to Return</h3>
          <div class="items-list">
            ${itemsHtml}
          </div>
        </div>

        <div class="order-details">
          <h3>Next Steps</h3>
          <p>Our team will review your return request within 2-3 business days. You'll receive an email with return shipping instructions once approved.</p>
        </div>
      `;

      const htmlContent = this.generateEmailTemplate(
        'Return Request Confirmation',
        content,
        order.shippingAddress?.fullName || 'Valued Customer'
      );

      return await this.sendEmail({
        to: returnRequest.customerEmail,
        subject: `Return Request Confirmation - ${returnRequest.formattedRequestNumber}`,
        htmlContent
      });

    } catch (error) {
      logError(error, { context: 'return_request_email', orderId: order._id });
      return { success: false, error: error.message };
    }
  }

  // Send refund confirmation email
  async sendRefundConfirmationEmail(order, refundEntry) {
    try {
      const content = `
        <p>Your refund has been processed successfully.</p>
        
        <div class="order-details">
          <h3>Refund Details</h3>
          <div class="detail-row">
            <span class="detail-label">Order Number:</span>
            <span class="detail-value highlight">${order.orderNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Refund Amount:</span>
            <span class="detail-value success">£${refundEntry.amount.toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Refund ID:</span>
            <span class="detail-value">${refundEntry.refundId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Processed Date:</span>
            <span class="detail-value">${new Date(refundEntry.date || refundEntry.processedAt).toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Reason:</span>
            <span class="detail-value">${refundEntry.reason}</span>
          </div>
        </div>

        <p>The refund will appear in your original payment method within 5-10 business days.</p>
        
        <p>If you have any questions about this refund, please contact our support team with your refund ID.</p>
      `;

      const htmlContent = this.generateEmailTemplate(
        'Refund Confirmation',
        content,
        // Guest orders have no populated userId — the shipping name is the
        // only reliable display name on every order shape.
        order.shippingAddress?.fullName || 'Valued Customer'
      );

      return await this.sendEmail({
        to: order.customerEmail,
        subject: `Refund Confirmation - ${order.orderNumber}`,
        htmlContent
      });

    } catch (error) {
      logError(error, { context: 'refund_confirmation_email', orderId: order._id });
      return { success: false, error: error.message };
    }
  }

  // Send account status update emails
  async sendAccountDisabledEmail(user, adminUser) {
    try {
      const emailData = {
        to: user.email,
        subject: 'Account Status Update - Graphene Security',
        template: 'account-disabled',
        data: {
          customerName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          disabledDate: new Date().toLocaleDateString(),
          adminEmail: adminUser ? adminUser.email : 'system@graphene-security.com',
          supportEmail: 'support@graphene-security.com'
        }
      };

      // For testing purposes, log the email data
      logger.debug('Account Disabled Email:', emailData);

      const content = `
        <p>We're writing to inform you that your Graphene Security account has been temporarily disabled.</p>
        
        <div class="order-details">
          <h3>Account Details</h3>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${user.email}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Disabled Date:</span>
            <span class="detail-value">${emailData.data.disabledDate}</span>
          </div>
        </div>

        <p>If you believe this was done in error or have questions about your account status, please contact our support team immediately.</p>
        
        <p>Our team will review your account and respond within 24-48 hours.</p>
      `;

      const htmlContent = this.generateEmailTemplate(
        'Account Status Update',
        content,
        emailData.data.customerName
      );

      const result = await this.sendEmail({
        to: user.email,
        subject: 'Account Status Update - Graphene Security',
        htmlContent
      });

      // Return with specific messageId format for account disabled emails
      if (result.success) {
        // Simulate async processing (for testing error scenarios)
        await new Promise(resolve => setTimeout(resolve, 1));
        
        return {
          success: true,
          messageId: `account_disabled_${Date.now()}`,
          message: 'Account disabled email queued for delivery'
        };
      }

      return result;

    } catch (error) {
      logError(error, { context: 'account_disabled_email', userId: user._id });
      return { success: false, error: error.message };
    }
  }

  async sendAccountReEnabledEmail(user, adminUser) {
    try {
      const loginUrl = process.env.FRONTEND_URL ? 
        `${process.env.FRONTEND_URL}/login` : 
        'https://graphene-security.com/login';

      const emailData = {
        to: user.email,
        subject: 'Account Re-enabled - Graphene Security',
        template: 'account-re-enabled',
        data: {
          customerName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          reEnabledDate: new Date().toLocaleDateString(),
          adminEmail: adminUser ? adminUser.email : 'system@graphene-security.com',
          supportEmail: 'support@graphene-security.com',
          loginUrl: loginUrl
        }
      };

      // For testing purposes, log the email data
      logger.debug('Account Re-enabled Email:', emailData);

      const content = `
        <p>Good news! Your Graphene Security account has been re-enabled and you can now access all features.</p>
        
        <div class="order-details">
          <h3>Account Details</h3>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${user.email}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Re-enabled Date:</span>
            <span class="detail-value">${emailData.data.reEnabledDate}</span>
          </div>
        </div>

        <p>You can now log in to your account and continue shopping for privacy-focused GrapheneOS devices.</p>
        
        <a href="${loginUrl}" class="btn">Login to Your Account</a>
        
        <p>Thank you for your patience during the review process.</p>
      `;

      const htmlContent = this.generateEmailTemplate(
        'Account Re-enabled',
        content,
        emailData.data.customerName
      );

      const result = await this.sendEmail({
        to: user.email,
        subject: 'Account Re-enabled - Graphene Security',
        htmlContent
      });

      // Return with specific messageId format for account re-enabled emails
      if (result.success) {
        // Simulate async processing (for testing error scenarios)
        await new Promise(resolve => setTimeout(resolve, 1));
        
        return {
          success: true,
          messageId: `account_reenabled_${Date.now()}`,
          message: 'Account re-enabled email queued for delivery'
        };
      }

      return result;

    } catch (error) {
      logError(error, { context: 'account_reenabled_email', userId: user._id });
      return { success: false, error: error.message };
    }
  }

  // Payment-related emails
  async sendPaymentConfirmationEmail(order, paymentDetails) {
    try {
      const content = `
        <p>Your payment has been successfully processed for your Graphene Security order.</p>
        
        <div class="order-details">
          <h3>Payment Details</h3>
          <div class="detail-row">
            <span class="detail-label">Order Number:</span>
            <span class="detail-value highlight">${order.orderNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Amount:</span>
            <span class="detail-value success">£${order.totalAmount.toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-value">${paymentDetails.method || order.paymentMethod?.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Transaction ID:</span>
            <span class="detail-value">${paymentDetails.transactionId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Date:</span>
            <span class="detail-value">${new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <p>Your order is now being processed and will ship within 2-4 business days.</p>
      `;

      const htmlContent = this.generateEmailTemplate(
        'Payment Confirmation',
        content,
        order.shippingAddress?.fullName || 'Valued Customer'
      );

      return await this.sendEmail({
        to: order.customerEmail,
        subject: `Payment Confirmed - ${order.orderNumber}`,
        htmlContent
      });

    } catch (error) {
      logError(error, { context: 'payment_confirmation_email', orderId: order._id });
      return { success: false, error: error.message };
    }
  }

  // Send data export email
  async sendDataExportEmail(userEmail, firstName, exportDetails) {
    try {
      const content = `
        <p>Your data export request has been processed and is ready for download.</p>
        
        <div class="order-details">
          <h3>Download Details</h3>
          <div class="detail-row">
            <span class="detail-label">Download Link:</span>
            <span class="detail-value"><a href="${exportDetails.downloadUrl}" class="highlight">Download Your Data</a></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Expires:</span>
            <span class="detail-value">${exportDetails.expiresAt.toLocaleDateString()} at ${exportDetails.expiresAt.toLocaleTimeString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Format:</span>
            <span class="detail-value">JSON</span>
          </div>
        </div>

        <div class="important-notice">
          <h3>Important Information</h3>
          <ul>
            <li>Your download link will expire in 48 hours for security purposes</li>
            <li>The file contains all your personal data in a machine-readable format</li>
            <li>Please store this data securely and delete it when no longer needed</li>
            <li>If you have any questions, please contact our support team</li>
          </ul>
        </div>

        <p>Thank you for using Graphene Security. We're committed to protecting your privacy and data rights.</p>
      `;

      const htmlContent = this.generateEmailTemplate(
        'Your Data Export is Ready',
        content,
        firstName || 'Valued Customer'
      );

      return await this.sendEmail({
        to: userEmail,
        subject: 'Your Data Export is Ready for Download',
        htmlContent,
        emailType: 'account.data_export'
      });

    } catch (error) {
      logError(error, { context: 'data_export_email', userEmail });
      return { success: false, error: error.message };
    }
  }

  // Send account deletion confirmation email
  async sendAccountDeletionConfirmationEmail(userEmail, firstName, deletionDetails) {
    try {
      const content = `
        <p>We have received your request to delete your account. This email confirms that your deletion request is being processed.</p>
        
        <div class="order-details">
          <h3>Deletion Request Details</h3>
          <div class="detail-row">
            <span class="detail-label">Request ID:</span>
            <span class="detail-value highlight">${deletionDetails.requestId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Requested:</span>
            <span class="detail-value">${new Date().toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Estimated Completion:</span>
            <span class="detail-value">${deletionDetails.estimatedCompletion}</span>
          </div>
        </div>

        <div class="important-notice">
          <h3>What Happens Next</h3>
          <ul>
            <li>Your account will be deactivated and you will be logged out</li>
            <li>Personal data will be permanently deleted within ${deletionDetails.estimatedCompletion}</li>
            <li>Some data may be retained for legal/tax purposes (anonymized)</li>
            <li>This action cannot be undone once processing is complete</li>
          </ul>
        </div>

        <div class="important-notice">
          <h3>Data Retention Policy</h3>
          <p>In accordance with legal requirements, some order and transaction data may be retained for tax and legal compliance purposes. However, all personally identifiable information will be removed or anonymized.</p>
        </div>

        <p>If you did not request this deletion or have changed your mind, please contact our support team immediately at ${process.env.SUPPORT_EMAIL || 'support@graphene-security.com'}.</p>
      `;

      const htmlContent = this.generateEmailTemplate(
        'Account Deletion Request Confirmed',
        content,
        firstName || 'Valued Customer'
      );

      return await this.sendEmail({
        to: userEmail,
        subject: 'Account Deletion Request Confirmed',
        htmlContent,
        emailType: 'account.deletion_confirmation'
      });

    } catch (error) {
      logError(error, { context: 'account_deletion_confirmation_email', userEmail });
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, resetToken, userData = {}) {
    try {
      const resetUrl = process.env.FRONTEND_URL ?
        `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}` :
        `https://graphene-security.com/reset-password?token=${resetToken}`;

      const content = `
        <p>We received a request to reset the password for your Graphene Security account.</p>

        <div class="order-details">
          <h3>Reset Details</h3>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${userEmail}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Requested:</span>
            <span class="detail-value">${new Date().toLocaleString()}</span>
          </div>
        </div>

        <div class="order-details">
          <h3>Reset Your Password</h3>
          <p>To reset your password, click the button below. This link will expire in 1 hour for your security.</p>
          <a href="${resetUrl}" class="btn">Reset Password</a>
          <p style="font-size: 14px; color: #666; margin-top: 15px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #00d4ff; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>

        <div class="important-notice">
          <h3>Security Notice</h3>
          <ul>
            <li>This password reset link will expire in 1 hour for your security</li>
            <li>If you didn't request this password reset, please ignore this email</li>
            <li>Your password will remain unchanged until you use the link above</li>
            <li>For your protection, never share your password with anyone</li>
          </ul>
        </div>

        <p>If you have any concerns about your account security, please contact our support team at ${process.env.SUPPORT_EMAIL || 'support@graphene-security.com'}.</p>
      `;

      const htmlContent = this.generateEmailTemplate(
        'Reset Your Password',
        content,
        userData.firstName || 'Valued Customer'
      );

      return await this.sendEmail({
        to: userEmail,
        subject: 'Password Reset Request - Graphene Security',
        htmlContent,
        emailType: 'transactional.password_reset',
        skipPreferenceCheck: true // Always send password reset emails
      });

    } catch (error) {
      logError(error, { context: 'password_reset_email', userEmail });
      return { success: false, error: error.message };
    }
  }

  // Send welcome/email verification email
  async sendWelcomeEmail(userEmail, emailVerificationToken, userData) {
    try {
      // Point directly to backend API which will handle verification and redirect
      const verificationUrl = process.env.BACKEND_URL ? 
        `${process.env.BACKEND_URL}/api/auth/verify-email?token=${emailVerificationToken}` : 
        `https://api.graphene-security.com/api/auth/verify-email?token=${emailVerificationToken}`;

      const content = `
        <p>Welcome to Graphene Security! Thank you for creating an account with us.</p>
        
        <div class="order-details">
          <h3>Account Details</h3>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${userEmail}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Registration Date:</span>
            <span class="detail-value">${new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div class="order-details">
          <h3>Verify Your Email Address</h3>
          <p>To complete your registration and access all features, please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" class="btn">Verify Email Address</a>
          <p style="font-size: 14px; color: #666; margin-top: 15px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #00d4ff; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>

        <div class="order-details">
          <h3>What's Next?</h3>
          <ul>
            <li>Browse our selection of privacy-focused GrapheneOS devices</li>
            <li>Set up your shipping preferences</li>
            <li>Join our community of privacy-conscious users</li>
          </ul>
        </div>

        <p>Welcome aboard! We're excited to help you on your privacy journey.</p>
      `;

      const htmlContent = this.generateEmailTemplate(
        'Welcome to Graphene Security',
        content,
        userData.firstName || 'New User'
      );

      return await this.sendEmail({
        to: userEmail,
        subject: 'Welcome to Graphene Security - Please Verify Your Email',
        htmlContent,
        emailType: 'transactional.welcome',
        skipPreferenceCheck: true // Always send welcome emails
      });

    } catch (error) {
      logError(error, { context: 'welcome_email', userEmail });
      return { success: false, error: error.message };
    }
  }

  // Send account deletion completed email
  async sendAccountDeletionCompletedEmail(userEmail, firstName) {
    try {
      const content = `
        <p>Your account deletion has been completed successfully. All your personal data has been permanently removed from our systems.</p>
        
        <div class="important-notice">
          <h3>What Has Been Deleted</h3>
          <ul>
            <li>Personal profile information</li>
            <li>Contact details and addresses</li>
            <li>Account preferences and settings</li>
            <li>Shopping cart and wishlist data</li>
            <li>Marketing preferences and communications</li>
          </ul>
        </div>

        <div class="important-notice">
          <h3>Data Retained (Anonymized)</h3>
          <p>In compliance with legal and tax requirements, some transaction and order data has been retained but anonymized to remove all personally identifiable information.</p>
        </div>

        <p>Thank you for having been a customer of Graphene Security. We respect your privacy choices and your right to control your personal data.</p>
        
        <p>If you have any questions about this deletion or our data handling practices, you may contact our support team, though please note that we will not be able to access any of your previous account information.</p>
      `;

      const htmlContent = this.generateEmailTemplate(
        'Account Deletion Completed',
        content,
        firstName || 'Former Customer'
      );

      return await this.sendEmail({
        to: userEmail,
        subject: 'Account Deletion Completed',
        htmlContent,
        emailType: 'account.deletion_completed',
        skipPreferenceCheck: true // Send even if user opted out, as this is a legal notification
      });

    } catch (error) {
      logError(error, { context: 'account_deletion_completed_email', userEmail });
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const emailService = new EmailService();
export default emailService;

// Export individual functions for convenience
export const sendWelcomeEmail = emailService.sendWelcomeEmail.bind(emailService);
export const sendPasswordResetEmail = emailService.sendPasswordResetEmail.bind(emailService);
export const sendDataExportEmail = emailService.sendDataExportEmail.bind(emailService);
export const sendAccountDeletionConfirmationEmail = emailService.sendAccountDeletionConfirmationEmail.bind(emailService);
export const sendAccountDeletionCompletedEmail = emailService.sendAccountDeletionCompletedEmail.bind(emailService);
export const sendAccountDisabledEmail = emailService.sendAccountDisabledEmail.bind(emailService);
export const sendAccountReEnabledEmail = emailService.sendAccountReEnabledEmail.bind(emailService);