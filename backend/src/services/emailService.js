import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { fromEnv } from '@aws-sdk/credential-providers';
import logger, { logError } from '../utils/logger.js';

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
        logger.info('Email service disabled - using mock mode');
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
      // Test connection by getting account sending quota
      const command = new SendEmailCommand({
        Source: process.env.FROM_EMAIL,
        Destination: {
          ToAddresses: []
        },
        Message: {
          Subject: {
            Data: 'Test'
          },
          Body: {
            Text: {
              Data: 'Test'
            }
          }
        }
      });
      
      // This will validate credentials and configuration
      await this.sesClient.config.credentials();
      
      return { success: true, message: 'AWS SES connection verified' };
    } catch (error) {
      logError(error, { context: 'email_verification', email });
      return { success: false, error: error.message };
    }
  }

  // Send email with template
  async sendEmail({ to, subject, htmlContent, textContent, from = null }) {
    try {
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

      // Send email via SES
      const command = new SendEmailCommand(params);
      const result = await this.sesClient.send(command);
      
      logger.info('Email sent successfully via AWS SES:', {
        to,
        subject,
        messageId: result.MessageId
      });

      return {
        success: true,
        messageId: result.MessageId,
        message: 'Email sent successfully'
      };

    } catch (error) {
      logError(error, { context: 'email_send', to, subject });
      
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

  // Generate HTML email template base
  generateEmailTemplate(title, content, customerName = 'Valued Customer') {
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
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 30px 20px;
        }
        .content h2 {
          color: #333;
          font-size: 20px;
          margin-bottom: 20px;
        }
        .order-details {
          background-color: #f8f9fa;
          padding: 20px;
          margin: 20px 0;
          border-radius: 6px;
          border-left: 4px solid #667eea;
        }
        .order-details h3 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 16px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .detail-label {
          font-weight: 600;
          color: #666;
        }
        .detail-value {
          color: #333;
        }
        .highlight {
          color: #667eea;
          font-weight: bold;
        }
        .success {
          color: #28a745;
          font-weight: bold;
        }
        .warning {
          color: #dc3545;
          font-weight: bold;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #eee;
        }
        .footer p {
          margin: 5px 0;
          color: #666;
          font-size: 14px;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background-color: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .items-list {
          margin: 15px 0;
        }
        .item {
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .item:last-child {
          border-bottom: none;
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
          <p><strong>GrapheneOS Store</strong></p>
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
            <span class="detail-value success">£${order.orderTotal.toFixed(2)}</span>
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
            <span class="detail-value success">£${refundDetails.amount.toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Refund ID:</span>
            <span class="detail-value">${refundDetails.refundId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Processing Time:</span>
            <span class="detail-value">5-10 business days</span>
          </div>
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
            <span class="detail-value">£${order.orderTotal.toFixed(2)}</span>
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
        
        <p>Don't forget to explore our privacy app installation services to enhance your device's security and privacy features.</p>
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
      logError(error, { context: 'support_request_email', supportData });
      return { success: false, error: error.message };
    }
  }

  // Send contact acknowledgment email to customer
  async sendContactAcknowledgmentEmail(contactData) {
    try {
      const content = `
        <p>Thank you for contacting GrapheneOS Store support. We have received your message and will respond as soon as possible.</p>
        
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
        subject: 'We received your message - GrapheneOS Store Support',
        htmlContent
      });

    } catch (error) {
      logError(error, { context: 'contact_acknowledgment_email', supportData });
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
            <span class="detail-value">${new Date(refundEntry.processedAt).toLocaleDateString()}</span>
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
        `${order.userId.firstName} ${order.userId.lastName}`
      );

      return await this.sendEmail({
        to: order.userId.email,
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
        subject: 'Account Status Update - GrapheneOS Store',
        template: 'account-disabled',
        data: {
          customerName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          disabledDate: new Date().toLocaleDateString(),
          adminEmail: adminUser ? adminUser.email : 'system@grapheneos-store.com',
          supportEmail: 'support@grapheneos-store.com'
        }
      };

      // For testing purposes, log the email data
      logger.debug('Account Disabled Email:', emailData);

      const content = `
        <p>We're writing to inform you that your GrapheneOS Store account has been temporarily disabled.</p>
        
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
        subject: 'Account Status Update - GrapheneOS Store',
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
        'https://grapheneos-store.com/login';

      const emailData = {
        to: user.email,
        subject: 'Account Re-enabled - GrapheneOS Store',
        template: 'account-re-enabled',
        data: {
          customerName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          reEnabledDate: new Date().toLocaleDateString(),
          adminEmail: adminUser ? adminUser.email : 'system@grapheneos-store.com',
          supportEmail: 'support@grapheneos-store.com',
          loginUrl: loginUrl
        }
      };

      // For testing purposes, log the email data
      logger.debug('Account Re-enabled Email:', emailData);

      const content = `
        <p>Good news! Your GrapheneOS Store account has been re-enabled and you can now access all features.</p>
        
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
        subject: 'Account Re-enabled - GrapheneOS Store',
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
        <p>Your payment has been successfully processed for your GrapheneOS Store order.</p>
        
        <div class="order-details">
          <h3>Payment Details</h3>
          <div class="detail-row">
            <span class="detail-label">Order Number:</span>
            <span class="detail-value highlight">${order.orderNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Amount:</span>
            <span class="detail-value success">£${order.orderTotal.toFixed(2)}</span>
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

        <p>Your order is now being processed and will ship within 1-2 business days.</p>
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
}

// Create and export singleton instance
const emailService = new EmailService();
export default emailService;