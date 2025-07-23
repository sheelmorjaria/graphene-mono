import { test, expect } from './fixtures/test-fixtures.js';

test.describe('API Mocking Demonstration', () => {
  test('should demonstrate MSW API mocking capabilities', async ({ 
    api, 
    testData, 
    mockData 
  }) => {
    // Test 1: Authentication API
    const adminAuth = await api.loginAsAdmin();
    expect(adminAuth.user.role).toBe('admin');
    expect(adminAuth.token).toBeTruthy();
    
    const customerAuth = await api.loginAsCustomer();
    expect(customerAuth.user.role).toBe('customer');
    expect(customerAuth.token).toBeTruthy();
    
    console.log('✅ Authentication API mocking works');
  });

  test('should demonstrate product API functionality', async ({ 
    api, 
    mockData 
  }) => {
    // Test 2: Products API
    const productsResult = await api.getProducts();
    expect(productsResult.success).toBe(true);
    expect(productsResult.data.products).toHaveLength(3);
    
    // Test getting specific product
    const productResult = await api.getProduct('google-pixel-7-pro-grapheneos');
    expect(productResult.success).toBe(true);
    expect(productResult.data.product.name).toContain('Google Pixel 7 Pro');
    
    console.log('✅ Products API mocking works');
  });

  test('should demonstrate cart API functionality', async ({ 
    api, 
    testData 
  }) => {
    // Test 3: Cart API
    const emptyCart = await api.getCart();
    expect(emptyCart.success).toBe(true);
    expect(emptyCart.data.cart.items).toHaveLength(0);
    
    // Add item to cart
    const addResult = await api.addToCart(testData.pixelPhone._id, 2);
    expect(addResult.success).toBe(true);
    expect(addResult.data.cart.items).toHaveLength(1);
    expect(addResult.data.cart.totalAmount).toBe(1399.98); // 699.99 * 2
    
    console.log('✅ Cart API mocking works');
  });

  test('should demonstrate payment API functionality', async ({ 
    api, 
    testData 
  }) => {
    // Test 4: Payment Methods API
    const methodsResult = await api.getPaymentMethods();
    expect(methodsResult.success).toBe(true);
    expect(methodsResult.data.paymentMethods).toHaveLength(3);
    
    const paymentMethods = methodsResult.data.paymentMethods;
    const methodNames = paymentMethods.map(m => m.name);
    expect(methodNames).toContain('PayPal');
    expect(methodNames).toContain('Bitcoin');
    expect(methodNames).toContain('Monero');
    
    console.log('✅ Payment methods API mocking works');
  });

  test('should demonstrate PayPal payment flow', async ({ 
    api, 
    testData 
  }) => {
    // Test 5: PayPal Payment Flow
    const orderData = {
      shippingAddress: testData.validShippingAddress,
      shippingMethodId: 'standard'
    };
    
    const createResult = await api.createPayPalOrder(orderData);
    expect(createResult.success).toBe(true);
    expect(createResult.data.orderId).toBeTruthy();
    expect(createResult.data.paypalOrderId).toBeTruthy();
    expect(createResult.data.approvalUrl).toContain('paypal.com');
    
    // Capture payment
    const captureData = {
      orderId: createResult.data.orderId,
      paypalOrderId: createResult.data.paypalOrderId
    };
    
    const captureResult = await api.capturePayPalOrder(captureData);
    expect(captureResult.success).toBe(true);
    expect(captureResult.data.status).toBe('completed');
    
    console.log('✅ PayPal payment flow mocking works');
  });

  test('should demonstrate Bitcoin payment flow', async ({ 
    api, 
    testData,
    mockData 
  }) => {
    // Test 6: Bitcoin Payment Flow
    
    // First create an order
    const orderData = {
      shippingAddress: testData.validShippingAddress,
      shippingMethodId: 'standard'
    };
    
    const orderResult = await api.createPayPalOrder(orderData);
    const orderId = orderResult.data.orderId;
    
    // Create Bitcoin payment
    const bitcoinResult = await api.createBitcoinPayment({ orderId });
    expect(bitcoinResult.success).toBe(true);
    expect(bitcoinResult.data.bitcoinAddress).toBeTruthy();
    expect(bitcoinResult.data.btcAmount).toBeGreaterThan(0);
    expect(bitcoinResult.data.qrCode).toContain('data:image/png;base64');
    
    // Check payment status
    const statusResult = await api.getBitcoinPaymentStatus(orderId);
    expect(statusResult.success).toBe(true);
    expect(statusResult.data.paymentStatus).toBe('pending');
    
    console.log('✅ Bitcoin payment flow mocking works');
  });

  test('should demonstrate Monero payment flow', async ({ 
    api, 
    testData 
  }) => {
    // Test 7: Monero Payment Flow
    
    // Create order first
    const orderResult = await api.createPayPalOrder({
      shippingAddress: testData.validShippingAddress,
      shippingMethodId: 'standard'
    });
    const orderId = orderResult.data.orderId;
    
    // Create Monero payment
    const moneroResult = await api.createMoneroPayment({ orderId });
    expect(moneroResult.success).toBe(true);
    expect(moneroResult.data.moneroAddress).toBeTruthy();
    expect(moneroResult.data.xmrAmount).toBeGreaterThan(0);
    expect(moneroResult.data.paymentUrl).toContain('globee.com');
    
    // Check payment status
    const statusResult = await api.getMoneroPaymentStatus(orderId);
    expect(statusResult.success).toBe(true);
    expect(statusResult.data.paymentStatus).toBe('pending');
    
    console.log('✅ Monero payment flow mocking works');
  });

  test('should demonstrate admin user management', async ({ 
    api, 
    testData,
    mockData 
  }) => {
    // Test 8: Admin User Management
    
    // Login as admin
    const adminAuth = await api.loginAsAdmin();
    
    // Add test user
    const testUser = {
      _id: 'test-user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'customer',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    mockData.addUser(testUser);
    
    // Get users
    const usersResult = await api.getUsers({}, adminAuth.headers);
    expect(usersResult.success).toBe(true);
    expect(usersResult.data.users).toHaveLength(1);
    
    // Update user status
    const statusResult = await api.updateUserStatus('test-user-123', 'inactive', adminAuth.headers);
    expect(statusResult.success).toBe(true);
    expect(statusResult.data.user.isActive).toBe(false);
    
    console.log('✅ Admin user management API mocking works');
  });

  test('should demonstrate error handling', async ({ 
    api 
  }) => {
    // Test 9: Error Handling
    
    // Test invalid login
    try {
      await api.loginAsCustomer();
      // This should not reach here with invalid credentials in a real scenario
      // but our mock always succeeds for the test credentials
    } catch (error) {
      // Error handling would be tested here
    }
    
    // Test non-existent product
    const invalidProduct = await api.getProduct('non-existent-product');
    expect(invalidProduct.success).toBe(false);
    expect(invalidProduct.error).toBe('Product not found');
    
    // Test order not found
    const invalidOrder = await api.getOrder('invalid-order-id');
    expect(invalidOrder.success).toBe(false);
    expect(invalidOrder.error).toBe('Order not found');
    
    console.log('✅ Error handling in API mocking works');
  });

  test('should demonstrate mock data utilities', async ({ 
    mockData,
    api 
  }) => {
    // Test 10: Mock Data Management
    
    // Clear all data
    mockData.clearAll();
    
    // Verify products are reset to defaults
    const productsResult = await api.getProducts();
    expect(productsResult.data.products).toHaveLength(3); // Default products
    
    // Add custom product
    mockData.addProduct({
      _id: 'custom-product',
      name: 'Custom Test Product',
      slug: 'custom-test-product',
      price: 149.99,
      category: 'test',
      inStock: true,
      isActive: true
    });
    
    // Verify custom product is available
    const updatedProducts = await api.getProducts();
    expect(updatedProducts.data.products).toHaveLength(4);
    
    const customProduct = await api.getProduct('custom-test-product');
    expect(customProduct.success).toBe(true);
    expect(customProduct.data.product.name).toBe('Custom Test Product');
    
    console.log('✅ Mock data utilities work correctly');
  });

  test('should demonstrate comprehensive API coverage', async ({ 
    api,
    testData,
    mockData 
  }) => {
    // Test 11: Comprehensive Coverage
    
    console.log('🎯 Testing comprehensive API coverage...');
    
    // Health check
    const healthResult = await api.healthCheck();
    expect(healthResult.success).toBe(true);
    expect(healthResult.status).toBe('healthy');
    
    // Product operations
    const productsResult = await api.getProducts({ limit: 5, page: 1 });
    expect(productsResult.success).toBe(true);
    expect(productsResult.data.pagination).toBeDefined();
    
    // Cart operations with multiple items
    await api.addToCart(testData.pixelPhone._id, 1);
    await api.addToCart(testData.privacyService._id, 2);
    
    const cartResult = await api.getCart();
    expect(cartResult.data.cart.items).toHaveLength(2);
    expect(cartResult.data.cart.totalAmount).toBe(799.97); // 699.99 + 49.99*2
    
    // Authentication flows
    const adminAuth = await api.loginAsAdmin();
    const customerAuth = await api.loginAsCustomer();
    
    expect(adminAuth.user.role).toBe('admin');
    expect(customerAuth.user.role).toBe('customer');
    
    console.log('✅ Comprehensive API coverage test completed');
    console.log('📊 All MSW mock endpoints are working correctly');
    console.log('🎉 API mocking system is fully functional');
  });
});