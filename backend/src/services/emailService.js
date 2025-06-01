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
  }
};

export default emailService;