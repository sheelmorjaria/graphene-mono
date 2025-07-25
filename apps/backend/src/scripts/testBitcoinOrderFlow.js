import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Test user credentials (you might need to adjust these)
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!'
};

const testBitcoinOrderFlow = async () => {
  console.log('🧪 Testing Bitcoin Order Flow...\n');

  try {
    // Step 1: Login to get auth token
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });

    if (!loginResponse.ok) {
      const loginError = await loginResponse.json();
      console.log('❌ Login failed:', loginError.error);
      console.log('Creating test user...');
      
      // Try to register the user
      const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...TEST_USER,
          firstName: 'Test',
          lastName: 'User'
        })
      });
      
      if (!registerResponse.ok) {
        const registerError = await registerResponse.json();
        console.log('❌ Registration failed:', registerError.error);
        return;
      }
      
      const registerData = await registerResponse.json();
      console.log('✅ User registered successfully');
    }

    const loginData = await (loginResponse.ok ? loginResponse.json() : 
      await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_USER)
      }).then(r => r.json()));

    const authToken = loginData.data.token;
    console.log('✅ Login successful');

    // Step 2: Add item to cart
    console.log('\n2️⃣ Adding item to cart...');
    const addToCartResponse = await fetch(`${API_BASE_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        productId: '60d5ecb54b24b30012345678', // This should be a valid product ID
        quantity: 1
      })
    });

    if (!addToCartResponse.ok) {
      console.log('⚠️  Add to cart failed, trying to get a valid product ID...');
      
      // Get available products
      const productsResponse = await fetch(`${API_BASE_URL}/products`);
      const productsData = await productsResponse.json();
      
      if (productsData.data.products.length > 0) {
        const firstProduct = productsData.data.products[0];
        console.log(`Using product: ${firstProduct.name}`);
        
        const retryAddToCart = await fetch(`${API_BASE_URL}/cart/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            productId: firstProduct._id,
            quantity: 1
          })
        });
        
        if (!retryAddToCart.ok) {
          const cartError = await retryAddToCart.json();
          console.log('❌ Failed to add product to cart:', cartError.error);
          return;
        }
      }
    }
    
    console.log('✅ Item added to cart');

    // Step 3: Test Bitcoin order placement
    console.log('\n3️⃣ Testing Bitcoin order placement...');
    
    const bitcoinOrderData = {
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Test Street',
        city: 'London',
        stateProvince: 'England',
        postalCode: 'SW1A 1AA',
        country: 'United Kingdom',
        phoneNumber: '+44123456789'
      },
      shippingMethodId: '60d5ecb54b24b30012345679', // You might need to get a valid shipping method ID
      paymentMethod: {
        type: 'bitcoin',
        name: 'Bitcoin'
      },
      useSameAsShipping: true
    };

    // Get available shipping methods first
    const shippingResponse = await fetch(`${API_BASE_URL}/shipping/methods`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (shippingResponse.ok) {
      const shippingData = await shippingResponse.json();
      if (shippingData.data.shippingMethods.length > 0) {
        bitcoinOrderData.shippingMethodId = shippingData.data.shippingMethods[0]._id;
        console.log(`Using shipping method: ${shippingData.data.shippingMethods[0].name}`);
      }
    }

    const orderResponse = await fetch(`${API_BASE_URL}/user/orders/place-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(bitcoinOrderData)
    });

    const orderData = await orderResponse.json();

    if (orderResponse.ok) {
      console.log('✅ Bitcoin order placed successfully!');
      console.log('📦 Order Details:');
      console.log(`   Order ID: ${orderData.data.order._id}`);
      console.log(`   Order Number: ${orderData.data.order.orderNumber}`);
      console.log(`   Payment Status: ${orderData.data.order.paymentStatus}`);
      console.log(`   Order Status: ${orderData.data.order.status}`);
      console.log(`   Total Amount: £${orderData.data.order.totalAmount}`);
      
      console.log('\n✅ Response structure is correct!');
      console.log(`   ✓ data.order._id: ${orderData.data.order._id}`);
      console.log(`   ✓ data.order.paymentStatus: ${orderData.data.order.paymentStatus}`);
      console.log(`   ✓ data.order.status: ${orderData.data.order.status}`);
      
    } else {
      console.log('❌ Bitcoin order placement failed:');
      console.log('Error:', orderData.error);
      console.log('Full response:', JSON.stringify(orderData, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
};

// Run the test
testBitcoinOrderFlow();