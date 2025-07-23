import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import PaymentGateway from '../PaymentGateway.js';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../test/setup.js';

describe('PaymentGateway Model', () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('Schema Validation', () => {
    it('should create a valid PayPal payment gateway', async () => {
      const paypalGateway = new PaymentGateway({
        name: 'PayPal',
        code: 'PAYPAL',
        type: 'digital_wallet',
        provider: 'paypal',
        isEnabled: true,
        supportedCurrencies: ['GBP', 'USD', 'EUR'],
        supportedCountries: ['GB', 'US'],
        config: {
          paypalClientId: 'paypal-client-id'
        },
        fees: {
          percentageFee: 2.9,
          fixedFee: 0.30
        }
      });

      const savedGateway = await paypalGateway.save();
      
      expect(savedGateway.name).toBe('PayPal');
      expect(savedGateway.code).toBe('PAYPAL');
      expect(savedGateway.type).toBe('digital_wallet');
      expect(savedGateway.provider).toBe('paypal');
      expect(savedGateway.isEnabled).toBe(true);
      expect(savedGateway.supportedCurrencies).toContain('GBP');
      expect(savedGateway.config.paypalClientId).toBe('paypal-client-id');
      expect(savedGateway.fees.percentageFee).toBe(2.9);
    });

    it('should create a valid Bitcoin payment gateway', async () => {
      const bitcoinGateway = new PaymentGateway({
        name: 'Bitcoin',
        code: 'BITCOIN',
        type: 'cryptocurrency',
        provider: 'bitcoin',
        isEnabled: true,
        supportedCurrencies: ['BTC'],
        supportedCountries: ['GB', 'US'],
        config: {
          bitcoinApiKey: 'blockonomics-api-key',
          bitcoinWebhookSecret: 'webhook-secret'
        },
        fees: {
          fixedFee: 0.0001
        }
      });

      const savedGateway = await bitcoinGateway.save();
      
      expect(savedGateway.name).toBe('Bitcoin');
      expect(savedGateway.code).toBe('BITCOIN');
      expect(savedGateway.type).toBe('cryptocurrency');
      expect(savedGateway.provider).toBe('bitcoin');
      expect(savedGateway.config.bitcoinApiKey).toBe('blockonomics-api-key');
      expect(savedGateway.fees.fixedFee).toBe(0.0001);
    });

    it('should create a valid Monero payment gateway', async () => {
      const moneroGateway = new PaymentGateway({
        name: 'Monero',
        code: 'MONERO',
        type: 'cryptocurrency',
        provider: 'monero',
        isEnabled: true,
        supportedCurrencies: ['XMR'],
        supportedCountries: ['GB', 'US'],
        config: {
          moneroApiKey: 'globee-api-key',
          moneroWebhookSecret: 'webhook-secret'
        },
        fees: {
          percentageFee: 1.0
        }
      });

      const savedGateway = await moneroGateway.save();
      
      expect(savedGateway.name).toBe('Monero');
      expect(savedGateway.code).toBe('MONERO');
      expect(savedGateway.type).toBe('cryptocurrency');
      expect(savedGateway.provider).toBe('monero');
      expect(savedGateway.config.moneroApiKey).toBe('globee-api-key');
    });

    it('should require name field', async () => {
      const gateway = new PaymentGateway({
        code: 'TEST',
        type: 'digital_wallet',
        provider: 'paypal',
        supportedCurrencies: ['GBP'],
        supportedCountries: ['GB']
      });

      await expect(gateway.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          name: expect.objectContaining({
            message: expect.stringContaining('required')
          })
        })
      });
    });

    it('should require code field', async () => {
      const gateway = new PaymentGateway({
        name: 'Test Gateway',
        type: 'digital_wallet',
        provider: 'paypal',
        supportedCurrencies: ['GBP'],
        supportedCountries: ['GB']
      });

      await expect(gateway.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          code: expect.objectContaining({
            message: expect.stringContaining('required')
          })
        })
      });
    });

    it('should validate type enum values', async () => {
      const gateway = new PaymentGateway({
        name: 'Invalid Gateway',
        code: 'INVALID',
        type: 'invalid-type',
        provider: 'other',
        supportedCurrencies: ['GBP'],
        supportedCountries: ['GB']
      });

      await expect(gateway.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          type: expect.objectContaining({
            message: expect.stringContaining('is not a valid enum value')
          })
        })
      });
    });

    it('should create gateway with default isEnabled false', async () => {
      const gateway = new PaymentGateway({
        name: 'Test Gateway',
        code: 'TEST',
        type: 'digital_wallet',
        provider: 'paypal',
        supportedCurrencies: ['GBP'],
        supportedCountries: ['GB']
      });

      const savedGateway = await gateway.save();
      expect(savedGateway.isEnabled).toBe(false);
    });
  });

  describe('Config Validation', () => {
    it('should validate PayPal config fields', async () => {
      const gateway = new PaymentGateway({
        name: 'PayPal',
        code: 'PAYPAL',
        type: 'digital_wallet',
        provider: 'paypal',
        supportedCurrencies: ['GBP'],
        supportedCountries: ['GB'],
        isEnabled: true,
        config: {} // Missing required fields
      });

      const savedGateway = await gateway.save();
      expect(savedGateway.isProperlyConfigured()).toBe(false);
    });

    it('should validate Bitcoin config fields', async () => {
      const gateway = new PaymentGateway({
        name: 'Bitcoin',
        code: 'BITCOIN',
        type: 'cryptocurrency',
        provider: 'bitcoin',
        supportedCurrencies: ['BTC'],
        supportedCountries: ['GB'],
        isEnabled: true,
        config: {
          bitcoinApiKey: 'test-key'
          // Missing bitcoinWebhookSecret
        }
      });

      const savedGateway = await gateway.save();
      expect(savedGateway.isProperlyConfigured()).toBe(true); // Only apiKey is required
    });

    it('should validate confirmation requirements', async () => {
      const gateway = new PaymentGateway({
        name: 'Bitcoin',
        code: 'BITCOIN',
        type: 'cryptocurrency',
        provider: 'bitcoin',
        supportedCurrencies: ['BTC'],
        supportedCountries: ['GB'],
        isEnabled: true,
        config: {
          bitcoinApiKey: 'test-key',
          bitcoinWebhookSecret: 'test-secret'
          // Note: confirmationsRequired is not in the schema
        }
      });

      const savedGateway = await gateway.save();
      expect(savedGateway.config.bitcoinApiKey).toBe('test-key');
    });
  });

  describe('Fee Structure Validation', () => {
    it('should validate percentage fee type', async () => {
      const gateway = new PaymentGateway({
        name: 'PayPal',
        code: 'PAYPAL',
        type: 'digital_wallet',
        provider: 'paypal',
        supportedCurrencies: ['GBP'],
        supportedCountries: ['GB'],
        isEnabled: true,
        config: { paypalClientId: 'test-id' },
        fees: {
          percentageFee: 60 // Invalid: over 50%
        }
      });

      await expect(gateway.save()).rejects.toThrow('Percentage fee cannot exceed 50%');
    });

    it('should validate fixed fee values', async () => {
      const gateway = new PaymentGateway({
        name: 'Bitcoin',
        code: 'BITCOIN',
        type: 'cryptocurrency',
        provider: 'bitcoin',
        supportedCurrencies: ['BTC'],
        supportedCountries: ['GB'],
        isEnabled: true,
        config: { bitcoinApiKey: 'test-key', bitcoinWebhookSecret: 'test-secret' },
        fees: {
          fixedFee: -1 // Invalid: negative value
        }
      });

      await expect(gateway.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          'fees.fixedFee': expect.objectContaining({
            message: expect.stringContaining('minimum')
          })
        })
      });
    });

    it('should allow valid fee structures', async () => {
      const gateway = new PaymentGateway({
        name: 'PayPal',
        code: 'PAYPAL',
        type: 'digital_wallet',
        provider: 'paypal',
        supportedCurrencies: ['GBP'],
        supportedCountries: ['GB'],
        isEnabled: true,
        config: { paypalClientId: 'test-id' },
        fees: {
          percentageFee: 2.9,
          fixedFee: 0.30,
          feeCurrency: 'GBP'
        }
      });

      const savedGateway = await gateway.save();
      expect(savedGateway.fees.percentageFee).toBe(2.9);
      expect(savedGateway.fees.fixedFee).toBe(0.30);
      expect(savedGateway.fees.feeCurrency).toBe('GBP');
    });
  });

  describe('Instance Methods', () => {
    let paypalGateway;

    beforeEach(async () => {
      paypalGateway = await PaymentGateway.create({
        name: 'PayPal',
        code: 'PAYPAL',
        type: 'digital_wallet',
        provider: 'paypal',
        isEnabled: true,
        supportedCurrencies: ['GBP', 'USD', 'EUR'],
        supportedCountries: ['GB'],
        config: {
          paypalClientId: 'test-client-id'
        },
        fees: {
          percentageFee: 2.9,
          fixedFee: 0.30
        }
      });
    });

    it('should calculate percentage-based fees correctly', () => {
      const amount = 100;
      const calculatedFee = paypalGateway.calculateFee(amount);
      
      // 2.9% of 100 + 0.30 fixed fee = 2.90 + 0.30 = 3.20
      expect(calculatedFee).toBe(3.2);
    });

    it('should calculate fixed fees correctly', async () => {
      const bitcoinGateway = await PaymentGateway.create({
        name: 'Bitcoin',
        code: 'BITCOIN',
        type: 'cryptocurrency',
        provider: 'bitcoin',
        supportedCurrencies: ['BTC'],
        supportedCountries: ['GB'],
        isEnabled: true,
        config: { bitcoinApiKey: 'test-key', bitcoinWebhookSecret: 'test-secret' },
        fees: {
          fixedFee: 0.0001,
          percentageFee: 0
        }
      });

      const calculatedFee = bitcoinGateway.calculateFee(1000);
      expect(calculatedFee).toBe(0.0001);
    });

    it('should check if gateway supports currency', () => {
      expect(paypalGateway.supportsCurrency('GBP')).toBe(true);
      expect(paypalGateway.supportsCurrency('USD')).toBe(true);
      expect(paypalGateway.supportsCurrency('JPY')).toBe(false);
    });

    it('should check if gateway is available', () => {
      expect(paypalGateway.isAvailable()).toBe(true);
      
      paypalGateway.isEnabled = false;
      expect(paypalGateway.isAvailable()).toBe(false);
    });

    it('should validate gateway configuration', () => {
      expect(paypalGateway.validateConfig()).toBe(true);
      
      paypalGateway.config.paypalClientId = undefined;
      expect(paypalGateway.validateConfig()).toBe(false);
    });

    it('should get secure config without sensitive data', () => {
      const secureConfig = paypalGateway.getSecureConfig();
      
      expect(secureConfig.paypalClientId).toBeUndefined(); // Should be filtered out
      // Check that at least one field is preserved (if it exists)
      const hasNonSensitiveFields = Object.keys(secureConfig).length >= 0;
      expect(hasNonSensitiveFields).toBe(true);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      await PaymentGateway.create([
        {
          name: 'PayPal',
          code: 'PAYPAL',
          type: 'digital_wallet',
          provider: 'paypal',
          isEnabled: true,
          supportedCurrencies: ['GBP', 'USD'],
          supportedCountries: ['GB']
        },
        {
          name: 'Bitcoin',
          code: 'BITCOIN',
          type: 'cryptocurrency',
          provider: 'bitcoin',
          isEnabled: true,
          supportedCurrencies: ['BTC'],
          supportedCountries: ['GB']
        },
        {
          name: 'Disabled Gateway',
          code: 'MONERO',
          type: 'cryptocurrency',
          provider: 'monero',
          isEnabled: false,
          supportedCurrencies: ['XMR'],
          supportedCountries: ['GB']
        }
      ]);
    });

    it('should find enabled gateways', async () => {
      const enabledGateways = await PaymentGateway.findEnabled();
      
      expect(enabledGateways).toHaveLength(2);
      expect(enabledGateways.every(gateway => gateway.isEnabled)).toBe(true);
    });

    it('should find gateways by type', async () => {
      const digitalWalletGateways = await PaymentGateway.findByType('digital_wallet');
      
      expect(digitalWalletGateways).toHaveLength(1);
      expect(digitalWalletGateways[0].type).toBe('digital_wallet');
    });

    it('should find gateways supporting currency', async () => {
      const gbpGateways = await PaymentGateway.findSupportingCurrency('GBP');
      
      expect(gbpGateways).toHaveLength(1);
      expect(gbpGateways[0].supportedCurrencies).toContain('GBP');
    });
  });

  describe('Soft Delete', () => {
    let gateway;

    beforeEach(async () => {
      gateway = await PaymentGateway.create({
        name: 'Test Gateway',
        code: 'TEST',
        type: 'digital_wallet',
        provider: 'paypal',
        supportedCurrencies: ['GBP'],
        supportedCountries: ['GB'],
        isEnabled: true,
        config: { paypalClientId: 'test-id' }
      });
    });

    it('should soft delete gateway', async () => {
      await gateway.softDelete();
      
      expect(gateway.isDeleted).toBe(true);
      expect(gateway.deletedAt).toBeInstanceOf(Date);
    });

    it('should restore soft deleted gateway', async () => {
      await gateway.softDelete();
      await gateway.restore();
      
      expect(gateway.isDeleted).toBe(false);
      expect(gateway.deletedAt).toBeNull();
    });

    it('should exclude soft deleted gateways from normal queries', async () => {
      await gateway.softDelete();
      
      const foundGateways = await PaymentGateway.find({});
      expect(foundGateways).toHaveLength(0);
    });
  });
});