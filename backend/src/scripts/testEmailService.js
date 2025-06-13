import emailService from '../services/emailService.js';

// Test email service integration with Mailtrap
async function testEmailService() {
  console.log('🧪 Testing Email Service Integration...\n');

  // Test 1: Connection verification
  console.log('1️⃣ Testing connection verification...');
  const connectionResult = await emailService.verifyConnection();
  console.log('Connection result:', connectionResult);
  console.log('');

  // Test 2: Send a test order confirmation email
  console.log('2️⃣ Testing order confirmation email...');
  const testOrder = {
    orderNumber: 'ORD-TEST-001',
    customerEmail: 'test@example.com',
    orderTotal: 899.99,
    orderDate: new Date(),
    items: [
      {
        productName: 'GrapheneOS Pixel 7 Pro',
        quantity: 1,
        unitPrice: 849.99,
        totalPrice: 849.99
      },
      {
        productName: 'Privacy App Installation',
        quantity: 1,
        unitPrice: 50.00,
        totalPrice: 50.00
      }
    ],
    shippingAddress: {
      fullName: 'John Privacy',
      addressLine1: '123 Secure Street',
      addressLine2: 'Apt 4B',
      city: 'Privacy City',
      stateProvince: 'Secure State',
      postalCode: 'PR1V4CY',
      country: 'UK'
    },
    paymentMethod: {
      name: 'PayPal'
    }
  };

  const orderEmailResult = await emailService.sendOrderConfirmationEmail(testOrder);
  console.log('Order confirmation result:', orderEmailResult);
  console.log('');

  // Test 3: Send a test support request email
  console.log('3️⃣ Testing support request email...');
  const testContactRequest = {
    fullName: 'Test Customer',
    email: 'customer@example.com',
    subject: 'technical-issue',
    orderNumber: 'ORD-TEST-002',
    message: 'I need help setting up GrapheneOS on my new device. The initial setup wizard is not responding properly.',
    submittedAt: new Date(),
    orderValidation: true
  };

  const supportEmailResult = await emailService.sendSupportRequestEmail(testContactRequest);
  console.log('Support request result:', supportEmailResult);
  console.log('');

  // Test 4: Send a test acknowledgment email
  console.log('4️⃣ Testing acknowledgment email...');
  const acknowledgmentResult = await emailService.sendContactAcknowledgmentEmail(testContactRequest);
  console.log('Acknowledgment result:', acknowledgmentResult);
  console.log('');

  // Test 5: Send a test order shipped email
  console.log('5️⃣ Testing order shipped email...');
  const shippedOrder = {
    ...testOrder,
    orderNumber: 'ORD-TEST-003',
    trackingNumber: 'TRK123456789',
    trackingUrl: 'https://tracking.example.com/TRK123456789',
    shippingMethod: {
      name: 'Express Delivery',
      estimatedDelivery: '1-2 business days'
    }
  };

  const shippedEmailResult = await emailService.sendOrderShippedEmail(shippedOrder);
  console.log('Order shipped result:', shippedEmailResult);
  console.log('');

  // Test 6: Send a test payment confirmation email
  console.log('6️⃣ Testing payment confirmation email...');
  const paymentDetails = {
    method: 'Bitcoin',
    transactionId: 'btc_tx_123456789abcdef',
    confirmations: 2
  };

  const paymentEmailResult = await emailService.sendPaymentConfirmationEmail(testOrder, paymentDetails);
  console.log('Payment confirmation result:', paymentEmailResult);
  console.log('');

  // Summary
  console.log('📧 Email Service Test Summary:');
  console.log('=====================================');
  console.log(`Connection: ${connectionResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Order Confirmation: ${orderEmailResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Support Request: ${supportEmailResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Acknowledgment: ${acknowledgmentResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Order Shipped: ${shippedEmailResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Payment Confirmation: ${paymentEmailResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log('');

  if (process.env.EMAIL_SERVICE === 'mailtrap') {
    console.log('🎉 Email tests completed! Check your Mailtrap inbox for test emails.');
  } else {
    console.log('📝 Email tests completed in mock mode. Set EMAIL_SERVICE=mailtrap to test real email sending.');
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEmailService().catch(console.error);
}

export default testEmailService;