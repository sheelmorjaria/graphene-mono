import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PaymentGateway from '../models/PaymentGateway.js';
import TaxRate from '../models/TaxRate.js';

// Load environment variables
dotenv.config();

const PAYMENT_GATEWAYS = [
  {
    name: 'PayPal',
    code: 'PAYPAL',
    type: 'digital_wallet',
    provider: 'paypal',
    isEnabled: true,
    isTestMode: true,
    supportedCurrencies: ['GBP', 'USD', 'EUR'],
    supportedCountries: ['GB', 'US', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'CA', 'AU'],
    displayOrder: 1,
    description: 'Pay securely with your PayPal account or credit/debit card',
    customerMessage: 'You will be redirected to PayPal to complete your payment',
    config: {
      paypalClientId: '',
      paypalWebhookId: ''
    },
    fees: {
      fixedFee: 0.30,
      percentageFee: 2.9,
      feeCurrency: 'GBP'
    },
    limits: {
      minAmount: 0.01,
      maxAmount: 10000,
      dailyLimit: null
    },
    features: {
      supportsRefunds: true,
      supportsPartialRefunds: true,
      supportsRecurring: false,
      supportsPreauth: false,
      requiresRedirect: true,
      supportsWebhooks: true
    },
    security: {
      requiresSSL: true,
      pciCompliant: true,
      requires3DS: false
    }
  },
  {
    name: 'Bitcoin',
    code: 'BITCOIN',
    type: 'cryptocurrency',
    provider: 'bitcoin',
    isEnabled: true,
    isTestMode: true,
    supportedCurrencies: ['BTC', 'GBP', 'USD', 'EUR'],
    supportedCountries: ['GB', 'US', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'CA', 'AU'],
    displayOrder: 2,
    description: 'Pay with Bitcoin for maximum privacy and security',
    customerMessage: 'Bitcoin payments require 2 confirmations (~30 minutes)',
    config: {
      bitcoinApiKey: '',
      bitcoinWebhookSecret: ''
    },
    fees: {
      fixedFee: 0,
      percentageFee: 1.0,
      feeCurrency: 'GBP'
    },
    limits: {
      minAmount: 0.01,
      maxAmount: 50000,
      dailyLimit: null
    },
    features: {
      supportsRefunds: false,
      supportsPartialRefunds: false,
      supportsRecurring: false,
      supportsPreauth: false,
      requiresRedirect: false,
      supportsWebhooks: true
    },
    security: {
      requiresSSL: true,
      pciCompliant: false,
      requires3DS: false
    }
  },
  {
    name: 'Monero',
    code: 'MONERO',
    type: 'cryptocurrency',
    provider: 'monero',
    isEnabled: true,
    isTestMode: true,
    supportedCurrencies: ['XMR', 'GBP', 'USD', 'EUR'],
    supportedCountries: ['GB', 'US', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'CA', 'AU'],
    displayOrder: 3,
    description: 'Pay with Monero for complete transaction privacy',
    customerMessage: 'Monero payments require 10 confirmations (~20 minutes)',
    config: {
      moneroApiKey: '',
      moneroWebhookSecret: ''
    },
    fees: {
      fixedFee: 0,
      percentageFee: 1.5,
      feeCurrency: 'GBP'
    },
    limits: {
      minAmount: 0.01,
      maxAmount: 50000,
      dailyLimit: null
    },
    features: {
      supportsRefunds: false,
      supportsPartialRefunds: false,
      supportsRecurring: false,
      supportsPreauth: false,
      requiresRedirect: false,
      supportsWebhooks: true
    },
    security: {
      requiresSSL: true,
      pciCompliant: false,
      requires3DS: false
    }
  }
];

const UK_TAX_RATES = [
  {
    name: 'UK VAT Standard Rate',
    region: 'United Kingdom',
    country: 'GB',
    state: '',
    postalCode: '',
    rate: 20.0,
    type: 'VAT',
    calculationMethod: 'inclusive',
    isActive: true,
    effectiveFrom: new Date('2011-01-04'),
    effectiveTo: null,
    description: 'Standard VAT rate for most goods and services in the UK',
    priority: 100,
    minimumOrderValue: 0
  },
  {
    name: 'UK VAT Zero Rate',
    region: 'United Kingdom - Essential Goods',
    country: 'GB',
    state: '',
    postalCode: '',
    rate: 0.0,
    type: 'VAT',
    calculationMethod: 'inclusive',
    isActive: true,
    effectiveFrom: new Date('1973-04-01'),
    effectiveTo: null,
    description: 'Zero VAT rate for essential goods like food, books, children\'s clothing',
    priority: 90,
    minimumOrderValue: 0
  },
  {
    name: 'Ireland VAT Standard Rate',
    region: 'Ireland',
    country: 'IE',
    state: '',
    postalCode: '',
    rate: 23.0,
    type: 'VAT',
    calculationMethod: 'inclusive',
    isActive: true,
    effectiveFrom: new Date('2012-01-01'),
    effectiveTo: null,
    description: 'Standard VAT rate for Ireland',
    priority: 100,
    minimumOrderValue: 0
  }
];

async function seedPaymentGateways() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grapheneos-store');
    
    console.log('Connected to MongoDB');
    console.log('Seeding payment gateways...');
    
    // Clear existing payment gateways
    await PaymentGateway.deleteMany({});
    console.log('Cleared existing payment gateways');
    
    // Insert new payment gateways
    const gateways = await PaymentGateway.insertMany(PAYMENT_GATEWAYS);
    console.log(`Created ${gateways.length} payment gateways:`);
    gateways.forEach(gateway => {
      console.log(`  - ${gateway.name} (${gateway.code}) - ${gateway.isEnabled ? 'Enabled' : 'Disabled'}`);
    });
    
    console.log('\nSeeding tax rates...');
    
    // Clear existing tax rates
    await TaxRate.deleteMany({});
    console.log('Cleared existing tax rates');
    
    // Insert new tax rates
    const taxRates = await TaxRate.insertMany(UK_TAX_RATES);
    console.log(`Created ${taxRates.length} tax rates:`);
    taxRates.forEach(rate => {
      console.log(`  - ${rate.name}: ${rate.rate}% (${rate.country})`);
    });
    
    console.log('\nPayment gateways and tax rates seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding payment gateways:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeding function
seedPaymentGateways();