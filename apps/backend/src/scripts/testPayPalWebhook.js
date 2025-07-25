import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Test PayPal webhook endpoint
const testPayPalWebhook = async () => {
  const webhookUrl = process.env.BACKEND_URL 
    ? `${process.env.BACKEND_URL}/api/payments/paypal/webhook`
    : 'https://graphene-backend.onrender.com/api/payments/paypal/webhook';

  console.log('🔔 Testing PayPal webhook endpoint...');
  console.log('📍 Webhook URL:', webhookUrl);

  // Sample PayPal webhook events for testing
  const testEvents = [
    {
      name: 'PAYMENT.CAPTURE.COMPLETED',
      data: {
        id: 'WH-test-capture-completed',
        event_version: '1.0',
        create_time: new Date().toISOString(),
        resource_type: 'capture',
        resource_version: '2.0',
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        summary: 'Payment completed for order TEST-ORDER-123',
        resource: {
          id: '5TY05013RG002845M',
          amount: {
            currency_code: 'GBP',
            value: '500.00'
          },
          final_capture: true,
          seller_protection: {
            status: 'ELIGIBLE',
            dispute_categories: ['ITEM_NOT_RECEIVED', 'UNAUTHORIZED_TRANSACTION']
          },
          supplementary_data: {
            related_ids: {
              order_id: 'TEST-ORDER-123'
            }
          },
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString(),
          status: 'COMPLETED'
        }
      }
    },
    {
      name: 'PAYMENT.CAPTURE.DENIED',
      data: {
        id: 'WH-test-capture-denied',
        event_version: '1.0',
        create_time: new Date().toISOString(),
        resource_type: 'capture',
        resource_version: '2.0',
        event_type: 'PAYMENT.CAPTURE.DENIED',
        summary: 'Payment denied for order TEST-ORDER-124',
        resource: {
          id: '5TY05013RG002846M',
          amount: {
            currency_code: 'GBP',
            value: '300.00'
          },
          status: 'DENIED',
          status_details: {
            reason: 'PERMISSION_DENIED'
          },
          supplementary_data: {
            related_ids: {
              order_id: 'TEST-ORDER-124'
            }
          },
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString()
        }
      }
    },
    {
      name: 'CHECKOUT.ORDER.APPROVED',
      data: {
        id: 'WH-test-order-approved',
        event_version: '1.0',
        create_time: new Date().toISOString(),
        resource_type: 'checkout-order',
        resource_version: '2.0',
        event_type: 'CHECKOUT.ORDER.APPROVED',
        summary: 'Order approved TEST-ORDER-125',
        resource: {
          id: 'TEST-ORDER-125',
          intent: 'CAPTURE',
          status: 'APPROVED',
          purchase_units: [
            {
              reference_id: 'default',
              amount: {
                currency_code: 'GBP',
                value: '750.00'
              }
            }
          ],
          payer: {
            name: {
              given_name: 'Test',
              surname: 'User'
            },
            email_address: 'test@example.com'
          },
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString()
        }
      }
    }
  ];

  console.log(`\n🧪 Testing ${testEvents.length} webhook events...\n`);

  // Test each webhook event
  for (const event of testEvents) {
    console.log(`📤 Testing ${event.name}...`);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PayPal/1.0 (PayPal Webhook Simulator)'
        },
        body: JSON.stringify(event.data)
      });

      const responseText = await response.text();
      
      if (response.ok) {
        console.log(`  ✅ Status: ${response.status} - ${response.statusText}`);
        console.log(`  📄 Response: ${responseText}`);
      } else {
        console.log(`  ❌ Status: ${response.status} - ${response.statusText}`);
        console.log(`  📄 Response: ${responseText}`);
      }

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    
    console.log(''); // Empty line for spacing
  }

  // Test invalid event type
  console.log('📤 Testing UNKNOWN event type...');
  try {
    const unknownEvent = {
      id: 'WH-test-unknown',
      event_version: '1.0',
      create_time: new Date().toISOString(),
      resource_type: 'unknown',
      resource_version: '2.0',
      event_type: 'UNKNOWN.EVENT.TYPE',
      summary: 'Unknown event type',
      resource: {}
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PayPal/1.0 (PayPal Webhook Simulator)'
      },
      body: JSON.stringify(unknownEvent)
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log(`  ✅ Status: ${response.status} - ${response.statusText}`);
      console.log(`  📄 Response: ${responseText}`);
    } else {
      console.log(`  ❌ Status: ${response.status} - ${response.statusText}`);
      console.log(`  📄 Response: ${responseText}`);
    }

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }

  console.log('\n🏁 PayPal webhook test completed!');
};

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPayPalWebhook().catch(console.error);
}

export { testPayPalWebhook };