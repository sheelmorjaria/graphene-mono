// Email service for sending notifications
// In a production environment, this would integrate with a service like SendGrid, Amazon SES, or Nodemailer

const emailService = {
  // Send order cancellation email
  async sendOrderCancellationEmail(order, refundDetails = null) {
    try {
      // In production, this would send an actual email
      // For now, we'll log the email content and structure
      
      const emailContent = {
        to: order.customerEmail,
        subject: `Order Cancellation Confirmation - ${order.orderNumber}`,
        template: 'order-cancellation',
        data: {
          customerName: order.shippingAddress.fullName,
          orderNumber: order.orderNumber,
          orderDate: order.orderDate,
          totalAmount: order.totalAmount,
          items: order.items,
          refundDetails,
          supportEmail: 'support@grapheneos-store.com'
        }
      };

      // Log email details (in production, this would be sent via email provider)
      console.log('📧 Order Cancellation Email:', JSON.stringify(emailContent, null, 2));
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
        message: 'Order cancellation email queued for delivery'
      };
      
    } catch (error) {
      console.error('Error sending order cancellation email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send return request confirmation email
  async sendReturnRequestConfirmationEmail(returnRequest, order) {
    try {
      const emailContent = {
        to: returnRequest.customerEmail,
        subject: `Return Request Confirmation - ${returnRequest.formattedRequestNumber}`,
        template: 'return-request-confirmation',
        data: {
          customerName: order.shippingAddress.fullName,
          returnRequestNumber: returnRequest.formattedRequestNumber,
          orderNumber: order.orderNumber,
          requestDate: returnRequest.requestDate,
          totalRefundAmount: returnRequest.totalRefundAmount,
          items: returnRequest.items,
          returnShippingAddress: returnRequest.returnShippingAddress,
          supportEmail: 'support@grapheneos-store.com'
        }
      };

      console.log('📧 Return Request Confirmation Email:', JSON.stringify(emailContent, null, 2));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
        message: 'Return request confirmation email queued for delivery'
      };
      
    } catch (error) {
      console.error('Error sending return request confirmation email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send order confirmation email (for future use)
  async sendOrderConfirmationEmail(order) {
    try {
      const emailContent = {
        to: order.customerEmail,
        subject: `Order Confirmation - ${order.orderNumber}`,
        template: 'order-confirmation',
        data: {
          customerName: order.shippingAddress.fullName,
          orderNumber: order.orderNumber,
          orderDate: order.orderDate,
          totalAmount: order.totalAmount,
          items: order.items,
          shippingAddress: order.shippingAddress,
          estimatedDelivery: order.shippingMethod?.estimatedDelivery
        }
      };

      console.log('📧 Order Confirmation Email:', JSON.stringify(emailContent, null, 2));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
        message: 'Order confirmation email queued for delivery'
      };
      
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send support request email to customer support team
  async sendSupportRequestEmail(contactRequest) {
    try {
      const subjectMap = {
        'order-inquiry': 'Order Inquiry',
        'product-question': 'Product Question',
        'technical-issue': 'Technical Issue',
        'other': 'General Inquiry'
      };

      const emailContent = {
        to: 'support@grapheneos-store.com',
        subject: `[Contact Form] ${subjectMap[contactRequest.subject]} - ${contactRequest.fullName}`,
        template: 'support-request',
        data: {
          customerName: contactRequest.fullName,
          customerEmail: contactRequest.email,
          subject: subjectMap[contactRequest.subject],
          orderNumber: contactRequest.orderNumber,
          message: contactRequest.message,
          submittedAt: contactRequest.submittedAt,
          orderValidation: contactRequest.orderValidation,
          ipAddress: contactRequest.ipAddress,
          userAgent: contactRequest.userAgent
        }
      };

      console.log('📧 Support Request Email to Team:', JSON.stringify(emailContent, null, 2));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        messageId: `support_${Date.now()}`,
        message: 'Support request email sent to team'
      };
      
    } catch (error) {
      console.error('Error sending support request email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send acknowledgment email to customer
  async sendContactAcknowledgmentEmail(contactData) {
    try {
      const emailContent = {
        to: contactData.email,
        subject: 'We received your message - GrapheneOS Store Support',
        template: 'contact-acknowledgment',
        data: {
          customerName: contactData.fullName,
          subject: contactData.subject,
          message: contactData.message,
          supportEmail: 'support@grapheneos-store.com'
        }
      };

      console.log('📧 Contact Acknowledgment Email:', JSON.stringify(emailContent, null, 2));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        messageId: `ack_${Date.now()}`,
        message: 'Acknowledgment email sent to customer'
      };
      
    } catch (error) {
      console.error('Error sending acknowledgment email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send order shipped email notification
  async sendOrderShippedEmail(order) {
    try {
      const emailContent = {
        to: order.customer?.email || order.customerEmail,
        subject: `Your Order Has Shipped - ${order.orderNumber}`,
        template: 'order-shipped',
        data: {
          customerName: order.customer?.firstName || order.shippingAddress?.firstName,
          orderNumber: order.orderNumber,
          trackingNumber: order.trackingNumber,
          trackingUrl: order.trackingUrl,
          shippingCarrier: order.shippingMethod?.name || 'Standard Shipping',
          estimatedDelivery: order.shippingMethod?.estimatedDelivery,
          supportEmail: 'support@grapheneos-store.com'
        }
      };

      console.log('📧 Order Shipped Email:', JSON.stringify(emailContent, null, 2));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        messageId: `shipped_${Date.now()}`,
        message: 'Order shipped email queued for delivery'
      };
      
    } catch (error) {
      console.error('Error sending order shipped email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send order delivered email notification
  async sendOrderDeliveredEmail(order) {
    try {
      const emailContent = {
        to: order.customer?.email || order.customerEmail,
        subject: `Your Order Has Been Delivered - ${order.orderNumber}`,
        template: 'order-delivered',
        data: {
          customerName: order.customer?.firstName || order.shippingAddress?.firstName,
          orderNumber: order.orderNumber,
          trackingNumber: order.trackingNumber,
          deliveryDate: new Date().toLocaleDateString(),
          supportEmail: 'support@grapheneos-store.com'
        }
      };

      console.log('📧 Order Delivered Email:', JSON.stringify(emailContent, null, 2));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        messageId: `delivered_${Date.now()}`,
        message: 'Order delivered email queued for delivery'
      };
      
    } catch (error) {
      console.error('Error sending order delivered email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send order status update email notification
  async sendOrderStatusUpdateEmail(order, newStatus, oldStatus) {
    try {
      const statusMessages = {
        'processing': 'Your order is now being processed',
        'awaiting_shipment': 'Your order is ready and awaiting shipment',
        'shipped': 'Your order has been shipped',
        'delivered': 'Your order has been delivered',
        'cancelled': 'Your order has been cancelled',
        'refunded': 'Your order refund has been processed'
      };

      const emailContent = {
        to: order.customer?.email || order.customerEmail,
        subject: `Order Status Update - ${order.orderNumber}`,
        template: 'order-status-update',
        data: {
          customerName: order.customer?.firstName || order.shippingAddress?.firstName,
          orderNumber: order.orderNumber,
          newStatus: newStatus,
          oldStatus: oldStatus,
          statusMessage: statusMessages[newStatus],
          trackingNumber: order.trackingNumber,
          trackingUrl: order.trackingUrl,
          supportEmail: 'support@grapheneos-store.com'
        }
      };

      console.log('📧 Order Status Update Email:', JSON.stringify(emailContent, null, 2));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        messageId: `status_update_${Date.now()}`,
        message: 'Order status update email queued for delivery'
      };
      
    } catch (error) {
      console.error('Error sending order status update email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Generate HTML email template for order cancellation
  generateCancellationEmailHTML(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Cancellation Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .order-details { background-color: #f8f9fa; padding: 15px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
        .highlight { color: #dc3545; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Cancellation Confirmation</h1>
        </div>
        <div class="content">
          <p>Dear ${data.customerName},</p>
          <p>Your order has been successfully cancelled as requested.</p>
          
          <div class="order-details">
            <h3>Order Details:</h3>
            <p><strong>Order Number:</strong> ${data.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(data.orderDate).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> £${data.totalAmount.toFixed(2)}</p>
          </div>

          ${data.refundDetails ? `
          <div class="order-details">
            <h3>Refund Information:</h3>
            <p>A refund of <span class="highlight">£${data.refundDetails.amount.toFixed(2)}</span> has been initiated.</p>
            <p>You should see the refund in your account within 5-10 business days.</p>
            <p><strong>Refund ID:</strong> ${data.refundDetails.refundId}</p>
          </div>
          ` : '<p>No refund was required for this order.</p>'}

          <p>We're sorry to see you cancel your order. If you have any questions or concerns, please don't hesitate to contact our support team.</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing GrapheneOS Store</p>
          <p>Need help? Contact us at ${data.supportEmail}</p>
        </div>
      </div>
    </body>
    </html>
    `;
  },

  // Send refund confirmation email
  async sendRefundConfirmationEmail(order, refundEntry) {
    try {
      const emailContent = {
        to: order.userId.email,
        subject: `Refund Confirmation - ${order.orderNumber}`,
        template: 'refund-confirmation',
        data: {
          customerName: `${order.userId.firstName} ${order.userId.lastName}`,
          orderNumber: order.orderNumber,
          orderDate: order.orderDate,
          refundAmount: refundEntry.amount,
          refundReason: refundEntry.reason,
          refundId: refundEntry.refundId,
          processedAt: refundEntry.processedAt,
          supportEmail: 'support@grapheneos-store.com'
        }
      };

      console.log('📧 Refund Confirmation Email:', JSON.stringify(emailContent, null, 2));
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
        message: 'Refund confirmation email queued for delivery'
      };
      
    } catch (error) {
      console.error('Error sending refund confirmation email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default emailService;