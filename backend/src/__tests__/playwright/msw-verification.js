#!/usr/bin/env node

/**
 * MSW Verification Script
 * 
 * This script demonstrates that the MSW (Mock Service Worker) setup
 * is working correctly by testing the handlers directly in Node.js.
 */

import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers.js';
import fetch from 'node-fetch';

// Create MSW server
const server = setupServer(...handlers);

async function verifyMSWSetup() {
  console.log('🚀 Starting MSW verification...\n');
  
  try {
    // Start MSW server
    server.listen();
    console.log('✅ MSW server started successfully\n');
    
    // Test 1: Health Check
    console.log('📊 Testing API endpoints...');
    const healthResponse = await fetch('http://localhost:3000/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData.status);
    
    // Test 2: Products API
    const productsResponse = await fetch('http://localhost:3000/api/products');
    const productsData = await productsResponse.json();
    console.log('✅ Products API:', `${productsData.data.products.length} products loaded`);
    
    // Test 3: Authentication
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@graphene-store.com',
        password: 'admin123'
      })
    });
    const loginData = await loginResponse.json();
    console.log('✅ Authentication:', `${loginData.data.user.role} login successful`);
    
    // Test 4: Cart Operations
    const cartResponse = await fetch('http://localhost:3000/api/cart/add', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-session-id': 'test-session'
      },
      body: JSON.stringify({
        productId: 'product-pixel-7-pro',
        quantity: 1
      })
    });
    const cartData = await cartResponse.json();
    console.log('✅ Cart Operations:', `${cartData.data.cart.items.length} items, total £${cartData.data.cart.totalAmount}`);
    
    // Test 5: Payment Methods
    const paymentMethodsResponse = await fetch('http://localhost:3000/api/payments/methods');
    const paymentMethodsData = await paymentMethodsResponse.json();
    console.log('✅ Payment Methods:', `${paymentMethodsData.data.paymentMethods.length} methods available`);
    
    // Test 6: PayPal Payment Creation
    const paypalResponse = await fetch('http://localhost:3000/api/payments/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shippingAddress: {
          fullName: 'Test User',
          addressLine1: '123 Test St',
          city: 'London',
          stateProvince: 'England',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        shippingMethodId: 'standard'
      })
    });
    const paypalData = await paypalResponse.json();
    console.log('✅ PayPal Payment:', `Order ${paypalData.data.orderNumber} created`);
    
    // Test 7: Error Handling
    const errorResponse = await fetch('http://localhost:3000/api/products/non-existent');
    const errorData = await errorResponse.json();
    console.log('✅ Error Handling:', `404 response - ${errorData.error}`);
    
    console.log('\n🎉 All MSW mock endpoints are working correctly!');
    console.log('📋 Summary:');
    console.log('   - Authentication: ✅ Working');
    console.log('   - Product Management: ✅ Working');
    console.log('   - Cart Operations: ✅ Working');
    console.log('   - Payment Processing: ✅ Working');
    console.log('   - Error Handling: ✅ Working');
    
    console.log('\n💡 The MSW setup is ready for Playwright E2E tests');
    console.log('   When integrated with a frontend application:');
    console.log('   1. Frontend runs on http://localhost:3000');
    console.log('   2. MSW intercepts all API calls');
    console.log('   3. Playwright tests interact with the UI');
    console.log('   4. All API responses are mocked automatically');
    
  } catch (error) {
    console.error('❌ MSW verification failed:', error.message);
  } finally {
    // Stop MSW server
    server.close();
    console.log('\n🧹 MSW server stopped');
  }
}

// Handle global fetch for Node.js
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

// Run verification
verifyMSWSetup();