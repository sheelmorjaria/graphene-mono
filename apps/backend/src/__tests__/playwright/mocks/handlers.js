import { http, HttpResponse } from 'msw';

// Mock data generators
const generateOrderId = () => `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generateTransactionId = () => `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generateBitcoinAddress = () => '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
const generateMoneroAddress = () => '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F';

// Payment method configurations
const paymentMethods = {
  paypal: {
    id: 'paypal',
    type: 'paypal',
    name: 'PayPal',
    description: 'Pay with your PayPal account',
    icon: 'paypal',
    enabled: true
  },
  bitcoin: {
    id: 'bitcoin',
    type: 'bitcoin', 
    name: 'Bitcoin',
    description: 'Pay with Bitcoin - private and secure',
    icon: 'bitcoin',
    enabled: true
  },
  monero: {
    id: 'monero',
    type: 'monero',
    name: 'Monero', 
    description: 'Pay with Monero - private and untraceable',
    icon: 'monero',
    enabled: true
  }
};

// Store for test data
const testOrders = new Map();
const testUsers = new Map();
const testProducts = new Map();
const testCarts = new Map();

// Default test products
const defaultProducts = [
  {
    _id: 'product-pixel-7-pro',
    name: 'Google Pixel 7 Pro - GrapheneOS',
    slug: 'google-pixel-7-pro-grapheneos',
    sku: 'PIX7PRO-GOS',
    price: 699.99,
    description: 'Google Pixel 7 Pro with GrapheneOS pre-installed for maximum privacy and security.',
    shortDescription: 'Privacy-focused Pixel 7 Pro',
    category: 'smartphones',
    condition: 'new',
    inStock: true,
    stockStatus: 'in_stock',
    status: 'active',
    isActive: true,
    images: [
      {
        original: 'pixel-7-pro-main.webp',
        thumbnail: 'thumb-pixel-7-pro-main.webp',
        url: '/uploads/products/pixel-7-pro-main.webp',
        thumbnailUrl: '/uploads/products/thumb-pixel-7-pro-main.webp'
      }
    ]
  },
  {
    _id: 'product-pixel-8',
    name: 'Google Pixel 8 - GrapheneOS',
    slug: 'google-pixel-8-grapheneos',
    sku: 'PIX8-GOS',
    price: 599.99,
    description: 'Google Pixel 8 with GrapheneOS pre-installed for enhanced privacy.',
    shortDescription: 'Privacy-focused Pixel 8',
    category: 'smartphones',
    condition: 'new',
    inStock: true,
    stockStatus: 'in_stock', 
    status: 'active',
    isActive: true,
    images: [
      {
        original: 'pixel-8-main.webp',
        thumbnail: 'thumb-pixel-8-main.webp',
        url: '/uploads/products/pixel-8-main.webp',
        thumbnailUrl: '/uploads/products/thumb-pixel-8-main.webp'
      }
    ]
  },
  {
    _id: 'service-privacy-setup',
    name: 'Privacy App Installation Service',
    slug: 'privacy-app-installation-service',
    sku: 'PRIV-SETUP',
    price: 49.99,
    description: 'Professional installation of privacy-focused applications including Signal, Tor Browser, ProtonMail, and other security tools.',
    shortDescription: 'Privacy app setup service',
    category: 'services',
    condition: 'new',
    inStock: true,
    stockStatus: 'in_stock',
    status: 'active',
    isActive: true,
    images: []
  }
];

// Initialize default products
defaultProducts.forEach(product => {
  testProducts.set(product._id, product);
});

export const handlers = [
  // Authentication endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    const { email, password } = body;

    if (email === 'admin@graphene-store.com' && password === 'admin123') {
      const adminUser = {
        _id: 'admin-user-id',
        email: 'admin@graphene-store.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true
      };
      
      return HttpResponse.json({
        success: true,
        data: {
          user: adminUser,
          token: 'mock-admin-jwt-token',
          refreshToken: 'mock-admin-refresh-token'
        }
      });
    }

    if (email === 'customer@example.com' && password === 'password123') {
      const customerUser = {
        _id: 'customer-user-id',
        email: 'customer@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
        isActive: true
      };

      return HttpResponse.json({
        success: true,
        data: {
          user: customerUser,
          token: 'mock-customer-jwt-token',
          refreshToken: 'mock-customer-refresh-token'
        }
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: 'Invalid email or password'
      },
      { status: 401 }
    );
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  }),

  // Products endpoints
  http.get('/api/products', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');

    let products = Array.from(testProducts.values());

    if (category) {
      products = products.filter(p => p.category === category);
    }

    if (search) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = products.slice(startIndex, endIndex);

    return HttpResponse.json({
      success: true,
      data: {
        products: paginatedProducts,
        pagination: {
          current: page,
          total: Math.ceil(products.length / limit),
          count: products.length,
          limit: limit
        }
      }
    });
  }),

  http.get('/api/products/:slug', ({ params }) => {
    const { slug } = params;
    const product = Array.from(testProducts.values()).find(p => p.slug === slug);

    if (!product) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Product not found'
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: { product }
    });
  }),

  // Cart endpoints
  http.get('/api/cart', ({ request }) => {
    const authHeader = request.headers.get('authorization');
    const userId = authHeader ? 'customer-user-id' : null;
    const sessionId = request.headers.get('x-session-id') || 'guest-session-123';

    const cartKey = userId || sessionId;
    const cart = testCarts.get(cartKey) || {
      _id: `cart-${cartKey}`,
      userId: userId,
      sessionId: userId ? null : sessionId,
      items: [],
      totalItems: 0,
      totalAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return HttpResponse.json({
      success: true,
      data: { cart }
    });
  }),

  http.post('/api/cart/add', async ({ request }) => {
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    const authHeader = request.headers.get('authorization');
    const userId = authHeader ? 'customer-user-id' : null;
    const sessionId = request.headers.get('x-session-id') || 'guest-session-123';

    const product = testProducts.get(productId);
    if (!product) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Product not found'
        },
        { status: 404 }
      );
    }

    const cartKey = userId || sessionId;
    const cart = testCarts.get(cartKey) || {
      _id: `cart-${cartKey}`,
      userId: userId,
      sessionId: userId ? null : sessionId,
      items: [],
      totalItems: 0,
      totalAmount: 0
    };

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].subtotal = cart.items[existingItemIndex].quantity * product.price;
    } else {
      cart.items.push({
        productId: productId,
        productName: product.name,
        productSlug: product.slug,
        unitPrice: product.price,
        quantity: quantity,
        subtotal: product.price * quantity
      });
    }

    // Recalculate totals
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    cart.updatedAt = new Date().toISOString();

    testCarts.set(cartKey, cart);

    return HttpResponse.json({
      success: true,
      data: { cart }
    });
  }),

  // Payment Methods endpoint
  http.get('/api/payments/methods', () => {
    return HttpResponse.json({
      success: true,
      data: {
        paymentMethods: Object.values(paymentMethods)
      }
    });
  }),

  // PayPal Payment endpoints
  http.post('/api/payments/paypal/create-order', async ({ request }) => {
    const body = await request.json();
    const { shippingAddress, shippingMethodId } = body;

    if (!shippingAddress || !shippingMethodId) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Shipping address and shipping method are required'
        },
        { status: 400 }
      );
    }

    const orderId = generateOrderId();
    const paypalOrderId = `PAYPAL-${Date.now()}`;

    const order = {
      _id: orderId,
      orderNumber: orderId,
      userId: 'customer-user-id',
      customerEmail: 'customer@example.com',
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: { type: 'paypal', name: 'PayPal' },
      items: [
        {
          productId: 'product-pixel-7-pro',
          productName: 'Google Pixel 7 Pro - GrapheneOS',
          quantity: 1,
          unitPrice: 699.99,
          totalPrice: 699.99
        }
      ],
      subtotal: 699.99,
      tax: 0,
      shipping: 9.99,
      totalAmount: 709.98,
      shippingAddress,
      paymentDetails: {
        paypalOrderId: paypalOrderId
      },
      createdAt: new Date().toISOString()
    };

    testOrders.set(orderId, order);

    return HttpResponse.json({
      success: true,
      data: {
        orderId: orderId,
        orderNumber: orderId,
        paypalOrderId: paypalOrderId,
        approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${paypalOrderId}`,
        totalAmount: 709.98
      }
    });
  }),

  http.post('/api/payments/paypal/capture', async ({ request }) => {
    const body = await request.json();
    const { orderId, paypalOrderId } = body;

    if (!orderId || !paypalOrderId) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Order ID and PayPal Order ID are required'
        },
        { status: 400 }
      );
    }

    const order = testOrders.get(orderId);
    if (!order) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
      );
    }

    // Update order status
    order.paymentStatus = 'completed';
    order.status = 'processing';
    order.paymentDetails = {
      ...order.paymentDetails,
      paypalCaptureId: `CAPTURE-${Date.now()}`,
      paypalTransactionId: generateTransactionId(),
      capturedAt: new Date().toISOString()
    };

    testOrders.set(orderId, order);

    return HttpResponse.json({
      success: true,
      data: {
        orderId: orderId,
        status: 'completed',
        paymentDetails: order.paymentDetails
      }
    });
  }),

  // Bitcoin Payment endpoints
  http.post('/api/payments/bitcoin/create', async ({ request }) => {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Order ID is required'
        },
        { status: 400 }
      );
    }

    const order = testOrders.get(orderId);
    if (!order) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
      );
    }

    const bitcoinAddress = generateBitcoinAddress();
    const exchangeRate = 0.000025; // Mock exchange rate
    const btcAmount = order.totalAmount * exchangeRate;

    // Update order with Bitcoin payment details
    order.paymentDetails = {
      bitcoinAddress: bitcoinAddress,
      bitcoinAmount: btcAmount,
      exchangeRate: exchangeRate,
      bitcoinPaymentExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    testOrders.set(orderId, order);

    return HttpResponse.json({
      success: true,
      data: {
        orderId: orderId,
        bitcoinAddress: bitcoinAddress,
        btcAmount: btcAmount,
        exchangeRate: exchangeRate,
        qrCode: 'data:image/png;base64,mock-qr-code-data',
        expirationTime: order.paymentDetails.bitcoinPaymentExpiry,
        requiredConfirmations: 2,
        orderTotal: order.totalAmount
      }
    });
  }),

  http.get('/api/payments/bitcoin/status/:orderId', ({ params }) => {
    const { orderId } = params;
    const order = testOrders.get(orderId);

    if (!order) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
      );
    }

    const isExpired = new Date() > new Date(order.paymentDetails?.bitcoinPaymentExpiry || 0);

    return HttpResponse.json({
      success: true,
      data: {
        orderId: orderId,
        paymentStatus: isExpired ? 'expired' : 'pending',
        confirmations: 0,
        amountReceived: 0,
        requiredAmount: order.paymentDetails?.bitcoinAmount || 0,
        isExpired: isExpired,
        requiredConfirmations: 2
      }
    });
  }),

  // Monero Payment endpoints
  http.post('/api/payments/monero/create', async ({ request }) => {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Order ID is required'
        },
        { status: 400 }
      );
    }

    const order = testOrders.get(orderId);
    if (!order) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
      );
    }

    const moneroAddress = generateMoneroAddress();
    const exchangeRate = 0.008; // Mock exchange rate
    const xmrAmount = order.totalAmount * exchangeRate;

    // Update order with Monero payment details
    order.paymentDetails = {
      globeePaymentId: `globee-${Date.now()}`,
      moneroAddress: moneroAddress,
      moneroAmount: xmrAmount,
      exchangeRate: exchangeRate,
      expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    testOrders.set(orderId, order);

    return HttpResponse.json({
      success: true,
      data: {
        orderId: orderId,
        orderNumber: order.orderNumber,
        moneroAddress: moneroAddress,
        xmrAmount: xmrAmount,
        exchangeRate: exchangeRate,
        paymentUrl: `https://globee.com/payment/${order.paymentDetails.globeePaymentId}`,
        expirationTime: order.paymentDetails.expirationTime,
        requiredConfirmations: 10,
        paymentWindowHours: 24,
        orderTotal: order.totalAmount
      }
    });
  }),

  http.get('/api/payments/monero/status/:orderId', ({ params }) => {
    const { orderId } = params;
    const order = testOrders.get(orderId);

    if (!order) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
      );
    }

    const isExpired = new Date() > new Date(order.paymentDetails?.expirationTime || 0);

    return HttpResponse.json({
      success: true,
      data: {
        orderId: orderId,
        paymentStatus: isExpired ? 'expired' : 'pending',
        confirmations: 0,
        paidAmount: 0,
        requiredAmount: order.paymentDetails?.moneroAmount || 0,
        isExpired: isExpired,
        requiredConfirmations: 10
      }
    });
  }),

  // Order endpoints
  http.get('/api/orders/:orderId', ({ params, request }) => {
    const { orderId } = params;
    const order = testOrders.get(orderId);

    if (!order) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: { order }
    });
  }),

  // User Management endpoints
  http.get('/api/admin/users', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const users = Array.from(testUsers.values());
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    return HttpResponse.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          current: page,
          total: Math.ceil(users.length / limit),
          count: users.length
        }
      }
    });
  }),

  http.patch('/api/admin/users/:userId/status', async ({ params, request }) => {
    const { userId } = params;
    const body = await request.json();
    const { status } = body;

    const user = testUsers.get(userId);
    if (!user) {
      return HttpResponse.json(
        {
          success: false,
          error: 'User not found'
        },
        { status: 404 }
      );
    }

    user.isActive = status === 'active';
    user.updatedAt = new Date().toISOString();
    testUsers.set(userId, user);

    return HttpResponse.json({
      success: true,
      data: { user }
    });
  }),

  // Webhook endpoints
  http.post('/api/webhooks/bitcoin', async ({ request }) => {
    const body = await request.json();
    
    return HttpResponse.json({
      success: true,
      received: true
    });
  }),

  http.post('/api/webhooks/monero', async ({ request }) => {
    const body = await request.json();
    
    return HttpResponse.json({
      success: true,
      received: true
    });
  }),

  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        payments: 'operational'
      }
    });
  }),

  // Fallback for unhandled requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.json(
      {
        success: false,
        error: `API endpoint not found: ${request.method} ${new URL(request.url).pathname}`
      },
      { status: 404 }
    );
  })
];

// Export utilities for test data manipulation
export const mockDataUtils = {
  // Product utilities
  addProduct: (product) => {
    testProducts.set(product._id, product);
  },
  removeProduct: (productId) => {
    testProducts.delete(productId);
  },
  getProduct: (productId) => {
    return testProducts.get(productId);
  },
  clearProducts: () => {
    testProducts.clear();
    // Re-add default products
    defaultProducts.forEach(product => {
      testProducts.set(product._id, product);
    });
  },

  // Order utilities
  addOrder: (order) => {
    testOrders.set(order._id, order);
  },
  getOrder: (orderId) => {
    return testOrders.get(orderId);
  },
  updateOrder: (orderId, updates) => {
    const order = testOrders.get(orderId);
    if (order) {
      Object.assign(order, updates);
      testOrders.set(orderId, order);
    }
    return order;
  },
  clearOrders: () => {
    testOrders.clear();
  },

  // User utilities
  addUser: (user) => {
    testUsers.set(user._id, user);
  },
  getUser: (userId) => {
    return testUsers.get(userId);
  },
  clearUsers: () => {
    testUsers.clear();
  },

  // Cart utilities
  getCart: (cartKey) => {
    return testCarts.get(cartKey);
  },
  clearCarts: () => {
    testCarts.clear();
  },

  // Clear all test data
  clearAll: () => {
    testOrders.clear();
    testUsers.clear();
    testCarts.clear();
    testProducts.clear();
    // Re-add default products
    defaultProducts.forEach(product => {
      testProducts.set(product._id, product);
    });
  }
};