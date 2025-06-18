// MongoDB initialization script
print('Starting MongoDB initialization...');

// Switch to the target database
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'graphene_store');

// Create application user
db.createUser({
  user: 'appuser',
  pwd: 'apppassword',
  roles: [
    {
      role: 'readWrite',
      db: process.env.MONGO_INITDB_DATABASE || 'graphene_store'
    }
  ]
});

// Create collections with validators
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 6
        },
        role: {
          bsonType: 'string',
          enum: ['user', 'admin']
        }
      }
    }
  }
});

db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'price', 'category'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200
        },
        price: {
          bsonType: 'number',
          minimum: 0
        },
        category: {
          bsonType: 'string'
        }
      }
    }
  }
});

db.createCollection('orders', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'orderNumber', 'status', 'totalAmount'],
      properties: {
        orderNumber: {
          bsonType: 'string',
          pattern: '^ORD-[0-9]+$'
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
        },
        totalAmount: {
          bsonType: 'number',
          minimum: 0
        }
      }
    }
  }
});

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.products.createIndex({ name: 1 });
db.products.createIndex({ category: 1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ isDeleted: 1 });

db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ orderNumber: 1 }, { unique: true });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: 1 });

db.paymentgateways.createIndex({ code: 1 }, { unique: true });
db.paymentgateways.createIndex({ isEnabled: 1, displayOrder: 1 });
db.paymentgateways.createIndex({ provider: 1, isEnabled: 1 });

// Insert sample data for development
if (process.env.NODE_ENV === 'development') {
  print('Inserting sample data for development...');
  
  // Sample categories
  db.categories.insertMany([
    {
      name: 'Google Pixel Phones',
      description: 'GrapheneOS-flashed Google Pixel smartphones',
      slug: 'pixel-phones',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Privacy Services',
      description: 'Privacy-focused app installation and configuration',
      slug: 'privacy-services',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  // Sample payment gateways
  db.paymentgateways.insertMany([
    {
      name: 'PayPal',
      code: 'PAYPAL',
      type: 'digital_wallet',
      provider: 'paypal',
      isEnabled: true,
      isTestMode: true,
      supportedCurrencies: ['GBP', 'USD', 'EUR'],
      supportedCountries: ['GB', 'US', 'IE'],
      displayOrder: 1,
      description: 'Pay with PayPal',
      customerMessage: 'You will be redirected to PayPal to complete your payment',
      config: {
        paypalClientId: 'sandbox-client-id',
        paypalWebhookId: 'webhook-id'
      },
      fees: {
        fixedFee: 0.30,
        percentageFee: 2.9,
        feeCurrency: 'GBP'
      },
      features: {
        supportsRefunds: true,
        supportsPartialRefunds: true,
        requiresRedirect: true,
        supportsWebhooks: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Bitcoin',
      code: 'BITCOIN',
      type: 'cryptocurrency',
      provider: 'bitcoin',
      isEnabled: true,
      isTestMode: true,
      supportedCurrencies: ['BTC'],
      supportedCountries: ['GB', 'US', 'IE'],
      displayOrder: 2,
      description: 'Pay with Bitcoin',
      customerMessage: 'Send Bitcoin to the provided address',
      config: {
        bitcoinApiKey: 'api-key',
        bitcoinWebhookSecret: 'webhook-secret'
      },
      fees: {
        fixedFee: 0.0001,
        percentageFee: 0,
        feeCurrency: 'BTC'
      },
      features: {
        supportsRefunds: false,
        supportsWebhooks: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  print('Sample data inserted successfully.');
}

print('MongoDB initialization completed successfully.');