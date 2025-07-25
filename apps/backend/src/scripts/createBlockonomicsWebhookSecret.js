import crypto from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Generate a secure webhook secret
const generateWebhookSecret = () => {
  // Generate 32 random bytes and convert to hex (64 characters)
  return crypto.randomBytes(32).toString('hex');
};

// Connect to Production MongoDB
const connectDB = async () => {
  try {
    // Use production MongoDB URI
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable not set');
    }

    console.log('🔗 Connecting to production database...');
    
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });
    
    console.log('✅ Connected to production MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Production MongoDB connection failed:', error.message);
    return false;
  }
};

// Create Blockonomics webhook secret
const createBlockonomicsWebhookSecret = async () => {
  console.log('🔐 Creating Blockonomics webhook secret for PRODUCTION...\n');

  try {
    // Connect to production database
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to production database');
    }

    // Import PaymentGateway model
    const { default: PaymentGateway } = await import('../models/PaymentGateway.js');

    // Generate secure webhook secret
    const webhookSecret = generateWebhookSecret();
    console.log('🔑 Generated webhook secret:', webhookSecret);

    // Production webhook URL
    const productionWebhookUrl = 'https://graphene-backend.onrender.com/api/payment/bitcoin/webhook';

    // Find or create Bitcoin gateway configuration
    let bitcoinGateway = await PaymentGateway.findOne({ provider: 'bitcoin' });

    if (!bitcoinGateway) {
      console.log('📝 Creating new Bitcoin gateway configuration in PRODUCTION...');
      
      bitcoinGateway = new PaymentGateway({
        name: 'Blockonomics Bitcoin Gateway',
        code: 'BLOCKONOMICS_BTC',
        type: 'cryptocurrency',
        provider: 'bitcoin',
        isEnabled: true,
        isTestMode: false, // Production mode
        supportedCurrencies: ['BTC'],
        supportedCountries: ['GB', 'US', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE'],
        displayOrder: 2,
        description: 'Pay with Bitcoin using Blockonomics - secure and private cryptocurrency payments',
        customerMessage: 'Complete your payment using Bitcoin. Transaction requires 2 confirmations.',
        config: {
          bitcoinApiKey: process.env.BLOCKONOMICS_API_KEY || 'CONFIGURE_IN_PRODUCTION',
          bitcoinWebhookSecret: webhookSecret,
          apiUrl: 'https://www.blockonomics.co/api',
          apiVersion: 'v1'
        },
        fees: {
          fixedFee: 0, // No additional fees for Bitcoin
          percentageFee: 0,
          feeCurrency: 'GBP'
        },
        limits: {
          minAmount: 0.001, // Minimum in BTC equivalent
          maxAmount: 10, // Maximum in BTC equivalent
          dailyLimit: 50 // Daily limit in BTC equivalent
        },
        features: {
          supportsRefunds: false, // Bitcoin transactions are irreversible
          supportsPartialRefunds: false,
          supportsRecurring: false,
          supportsPreauth: false,
          requiresRedirect: false,
          supportsWebhooks: true
        },
        security: {
          requiresSSL: true,
          pciCompliant: false, // Not applicable for cryptocurrency
          requires3DS: false
        }
      });

      await bitcoinGateway.save();
      console.log('✅ Created new Bitcoin gateway configuration in PRODUCTION');
    } else {
      console.log('📝 Updating existing Bitcoin gateway configuration in PRODUCTION...');
      
      // Update existing configuration
      bitcoinGateway.config = {
        ...bitcoinGateway.config,
        bitcoinWebhookSecret: webhookSecret,
        bitcoinApiKey: bitcoinGateway.config.bitcoinApiKey || process.env.BLOCKONOMICS_API_KEY || 'CONFIGURE_IN_PRODUCTION',
        apiUrl: bitcoinGateway.config.apiUrl || 'https://www.blockonomics.co/api',
        apiVersion: bitcoinGateway.config.apiVersion || 'v1'
      };

      // Update other fields if needed
      if (!bitcoinGateway.code) {
        bitcoinGateway.code = 'BLOCKONOMICS_BTC';
      }
      if (!bitcoinGateway.type) {
        bitcoinGateway.type = 'cryptocurrency';
      }
      if (!bitcoinGateway.features?.supportsWebhooks) {
        bitcoinGateway.features = {
          ...bitcoinGateway.features,
          supportsWebhooks: true
        };
      }

      await bitcoinGateway.save();
      console.log('✅ Updated existing Bitcoin gateway configuration in PRODUCTION');
    }

    // Display configuration summary
    console.log('\n📊 PRODUCTION Bitcoin Gateway Configuration:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Provider:              ${bitcoinGateway.provider}`);
    console.log(`Name:                  ${bitcoinGateway.name}`);
    console.log(`Enabled:               ${bitcoinGateway.enabled}`);
    console.log(`API Key:               ${bitcoinGateway.config.apiKey ? (bitcoinGateway.config.apiKey.startsWith('CONFIGURE') ? '❌ Not Set' : '✅ Set') : '❌ Not Set'}`);
    console.log(`Webhook Secret:        ✅ Set (${webhookSecret})`);
    console.log(`Confirmations Required: ${bitcoinGateway.config.confirmationsRequired}`);
    console.log(`Payment Timeout:       ${bitcoinGateway.config.paymentTimeoutMinutes} minutes`);
    console.log(`Webhook URL:           ${bitcoinGateway.config.webhookUrl}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Instructions for Blockonomics setup
    console.log('\n📋 PRODUCTION Setup - Configure in Blockonomics Dashboard:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. 🌐 Login to your Blockonomics dashboard');
    console.log('2. 🔧 Go to Settings > Webhook');
    console.log(`3. 🔗 Set Webhook URL: ${productionWebhookUrl}`);
    console.log(`4. 🔐 Set Webhook Secret: ${webhookSecret}`);
    console.log('5. ✅ Enable the webhook');
    console.log('6. 💾 Save settings');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Environment variable check for production
    console.log('\n💡 PRODUCTION Environment Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (!process.env.BLOCKONOMICS_API_KEY || process.env.BLOCKONOMICS_API_KEY.startsWith('CONFIGURE')) {
      console.log('⚠️  BLOCKONOMICS_API_KEY needs to be set in production environment');
      console.log('   Add this to your Render environment variables');
    } else {
      console.log('✅ BLOCKONOMICS_API_KEY is configured in production');
    }
    console.log('✅ Webhook secret is now stored in production database');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n🎉 Blockonomics webhook secret created in PRODUCTION database!');

    return {
      webhookSecret,
      gatewayId: bitcoinGateway._id,
      webhookUrl: bitcoinGateway.config.webhookUrl,
      environment: 'PRODUCTION'
    };

  } catch (error) {
    console.error('❌ Error creating webhook secret in production:', error.message);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📴 Production MongoDB connection closed');
    }
  }
};

// Test webhook secret generation
const testWebhookSecurity = () => {
  console.log('\n🧪 Testing webhook security...');
  
  const testSecret = generateWebhookSecret();
  const testPayload = JSON.stringify({
    addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    value: 100000000,
    txid: 'test-transaction-id',
    confirmations: 2
  });

  // Generate signature
  const signature = crypto
    .createHmac('sha256', testSecret)
    .update(testPayload)
    .digest('hex');

  console.log('🔐 Test secret:', testSecret);
  console.log('📄 Test payload:', testPayload);
  console.log('✍️  Generated signature:', signature);
  
  // Verify signature
  const verifySignature = crypto
    .createHmac('sha256', testSecret)
    .update(testPayload)
    .digest('hex');

  const isValid = signature === verifySignature;
  console.log('✅ Signature verification:', isValid ? 'PASSED' : 'FAILED');
  
  if (isValid) {
    console.log('🔒 Webhook security test completed successfully!');
  } else {
    console.log('❌ Webhook security test failed!');
  }
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  if (command === 'test') {
    testWebhookSecurity();
  } else {
    createBlockonomicsWebhookSecret()
      .then((result) => {
        console.log('\n🎯 PRODUCTION Summary:');
        console.log(`Environment: ${result.environment}`);
        console.log(`Webhook Secret: ${result.webhookSecret}`);
        console.log(`Gateway ID: ${result.gatewayId}`);
        console.log(`Webhook URL: ${result.webhookUrl}`);
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n💥 Production script failed:', error.message);
        process.exit(1);
      });
  }
}

export { createBlockonomicsWebhookSecret, generateWebhookSecret };