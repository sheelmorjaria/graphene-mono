import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import ShippingMethod from '../ShippingMethod.js';

let codeCounter = 0;
// Build a valid ShippingMethod doc. Each call varies a uniqueness-contributing
// field (code) so the unique index {code: 1} does not collide across tests.
const validMethod = (over = {}) => ({
  name: 'UK Standard Shipping',
  code: `STD_${codeCounter++}`,
  description: 'Standard delivery within the UK',
  estimatedDeliveryDays: { min: 2, max: 4 },
  baseCost: 4.99,
  ...over
});

describe('ShippingMethod Model', () => {
  beforeAll(async () => {
    await ShippingMethod.syncIndexes();
  });

  beforeEach(async () => {
    await ShippingMethod.deleteMany({});
  });

  afterEach(async () => {
    await ShippingMethod.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a valid shipping method with required fields', async () => {
      const data = validMethod();
      const doc = await new ShippingMethod(data).save();

      expect(doc._id).toBeDefined();
      expect(doc.name).toBe(data.name);
      expect(doc.code).toBe(data.code);
      expect(doc.description).toBe(data.description);
      expect(doc.estimatedDeliveryDays.min).toBe(2);
      expect(doc.estimatedDeliveryDays.max).toBe(4);
      expect(doc.baseCost).toBe(4.99);
      expect(doc.createdAt).toBeDefined();
    });

    it('should apply defaults (isActive, displayOrder, criteria, pricing)', async () => {
      const doc = await new ShippingMethod(validMethod()).save();

      // top-level defaults
      expect(doc.isActive).toBe(true);
      expect(doc.displayOrder).toBe(0);

      // criteria defaults
      expect(doc.criteria.minWeight).toBe(0);
      expect(doc.criteria.maxWeight).toBe(50000);
      expect(doc.criteria.minOrderValue).toBe(0);
      expect(doc.criteria.maxOrderValue).toBe(999999.99);
      expect(doc.criteria.supportedCountries).toEqual(['GB', 'IE']);

      // pricing defaults
      expect(doc.pricing.weightRate).toBe(0);
      expect(doc.pricing.baseWeight).toBe(1000);
      expect(doc.pricing.dimensionalWeightFactor).toBe(5000);
    });

    it('should require name', async () => {
      await expect(
        new ShippingMethod(validMethod({ name: undefined })).save()
      ).rejects.toThrow();
    });

    it('should require code', async () => {
      await expect(
        new ShippingMethod(validMethod({ code: undefined })).save()
      ).rejects.toThrow();
    });

    it('should require estimatedDeliveryDays.min', async () => {
      await expect(
        new ShippingMethod(validMethod({
          estimatedDeliveryDays: { min: undefined, max: 4 }
        })).save()
      ).rejects.toThrow();
    });

    it('should require estimatedDeliveryDays.max', async () => {
      await expect(
        new ShippingMethod(validMethod({
          estimatedDeliveryDays: { min: 2, max: undefined }
        })).save()
      ).rejects.toThrow();
    });

    it('should require baseCost', async () => {
      await expect(
        new ShippingMethod(validMethod({ baseCost: undefined })).save()
      ).rejects.toThrow();
    });

    it('should reject code that does not match the uppercase alphanumeric pattern', async () => {
      await expect(
        new ShippingMethod(validMethod({ code: 'invalid-code' })).save()
      ).rejects.toThrow();
    });

    it('should reject estimatedDeliveryDays.min below 1', async () => {
      await expect(
        new ShippingMethod(validMethod({
          estimatedDeliveryDays: { min: 0, max: 4 }
        })).save()
      ).rejects.toThrow();
    });

    it('should reject estimatedDeliveryDays.max above 365', async () => {
      await expect(
        new ShippingMethod(validMethod({
          estimatedDeliveryDays: { min: 2, max: 400 }
        })).save()
      ).rejects.toThrow();
    });

    it('should reject negative baseCost', async () => {
      await expect(
        new ShippingMethod(validMethod({ baseCost: -1 })).save()
      ).rejects.toThrow();
    });

    it('should reject invalid country codes in supportedCountries', async () => {
      await expect(
        new ShippingMethod(validMethod({
          criteria: { supportedCountries: ['GB', 'lowercase'] }
        })).save()
      ).rejects.toThrow();
    });

    it('should round baseCost to 2 decimal places via setter', async () => {
      const doc = await new ShippingMethod(validMethod({ baseCost: 4.999 })).save();
      expect(doc.baseCost).toBe(5);
    });

    it('should enforce a unique code', async () => {
      const data = validMethod({ code: 'UNIQUE_CODE_1' });
      await new ShippingMethod(data).save();
      await expect(new ShippingMethod(data).save()).rejects.toThrow();
    });
  });

  describe('Pre-save validation', () => {
    it('rejects when min delivery days > max delivery days', async () => {
      await expect(
        new ShippingMethod(validMethod({
          estimatedDeliveryDays: { min: 5, max: 3 }
        })).save()
      ).rejects.toThrow('Minimum delivery days cannot be greater than maximum delivery days');
    });

    it('rejects when minWeight >= maxWeight', async () => {
      await expect(
        new ShippingMethod(validMethod({
          criteria: { minWeight: 100, maxWeight: 100 }
        })).save()
      ).rejects.toThrow('Minimum weight must be less than maximum weight');
    });

    it('rejects when minOrderValue >= maxOrderValue', async () => {
      await expect(
        new ShippingMethod(validMethod({
          criteria: { minOrderValue: 500, maxOrderValue: 500 }
        })).save()
      ).rejects.toThrow('Minimum order value must be less than maximum order value');
    });
  });

  describe('Virtuals', () => {
    it('formattedDelivery returns singular form when min === max === 1', async () => {
      const doc = await new ShippingMethod(validMethod({
        estimatedDeliveryDays: { min: 1, max: 1 }
      })).save();
      expect(doc.formattedDelivery).toBe('1 business day');
    });

    it('formattedDelivery returns singular form when min === max > 1', async () => {
      const doc = await new ShippingMethod(validMethod({
        estimatedDeliveryDays: { min: 3, max: 3 }
      })).save();
      expect(doc.formattedDelivery).toBe('3 business days');
    });

    it('formattedDelivery returns a range when min !== max', async () => {
      const doc = await new ShippingMethod(validMethod({
        estimatedDeliveryDays: { min: 2, max: 4 }
      })).save();
      expect(doc.formattedDelivery).toBe('2-4 business days');
    });
  });

  describe('Instance methods — calculateCost', () => {
    // calculateCost reads cartData.items / cartData.totalValue and the address separately
    const cart = (items, totalValue) => ({ items, totalValue });
    const address = (country = 'GB') => ({ country });

    it('returns null when country is not supported', async () => {
      const doc = await new ShippingMethod(validMethod()).save();
      const result = doc.calculateCost(cart([{ weight: 100, quantity: 1 }], 50), address('US'));
      expect(result).toBeNull();
    });

    it('returns null when order value below minOrderValue', async () => {
      const doc = await new ShippingMethod(validMethod({
        criteria: { minOrderValue: 100, maxOrderValue: 1000, supportedCountries: ['GB'] }
      })).save();
      const result = doc.calculateCost(cart([{ weight: 100, quantity: 1 }], 50), address('GB'));
      expect(result).toBeNull();
    });

    it('returns null when order value above maxOrderValue', async () => {
      const doc = await new ShippingMethod(validMethod({
        criteria: { minOrderValue: 0, maxOrderValue: 100, supportedCountries: ['GB'] }
      })).save();
      const result = doc.calculateCost(cart([{ weight: 100, quantity: 1 }], 200), address('GB'));
      expect(result).toBeNull();
    });

    it('returns null when total weight exceeds maxWeight', async () => {
      const doc = await new ShippingMethod(validMethod({
        criteria: { maxWeight: 500, supportedCountries: ['GB'] }
      })).save();
      const result = doc.calculateCost(cart([{ weight: 600, quantity: 1 }], 50), address('GB'));
      expect(result).toBeNull();
    });

    it('returns base cost with no weight charge when weight is within baseWeight', async () => {
      const doc = await new ShippingMethod(validMethod({ baseCost: 4.99 })).save();
      const result = doc.calculateCost(cart([{ weight: 500, quantity: 1 }], 50), address('GB'));
      expect(result).not.toBeNull();
      expect(result.cost).toBe(4.99);
      expect(result.isFreeShipping).toBe(false);
      expect(result.details.weightCharge).toBe(0);
      expect(result.details.totalWeight).toBe(500);
    });

    it('adds a weight charge for weight above baseWeight', async () => {
      const doc = await new ShippingMethod(validMethod({
        baseCost: 5,
        pricing: { weightRate: 0.01, baseWeight: 1000 }
      })).save();
      // 1500g -> 500g excess @ 0.01/g = 5.00; total = 5 + 5 = 10
      const result = doc.calculateCost(cart([{ weight: 1500, quantity: 1 }], 50), address('GB'));
      expect(result).not.toBeNull();
      expect(result.cost).toBe(10);
      expect(result.details.weightCharge).toBe(5);
    });

    it('defaults item weight to 100g when not specified', async () => {
      const doc = await new ShippingMethod(validMethod({
        pricing: { weightRate: 0, baseWeight: 1000 }
      })).save();
      // 2 items without weight -> 100g each * 2 = 200g total
      const result = doc.calculateCost(cart([
        { quantity: 1 }, { quantity: 1 }
      ], 50), address('GB'));
      expect(result.details.totalWeight).toBe(200);
    });

    it('supports Ireland (IE) as a default supported country', async () => {
      const doc = await new ShippingMethod(validMethod()).save();
      const result = doc.calculateCost(cart([{ weight: 100, quantity: 1 }], 50), address('IE'));
      expect(result).not.toBeNull();
    });

    it('returns null when address has no supported country match', async () => {
      const doc = await new ShippingMethod(validMethod()).save();
      const result = doc.calculateCost(
        cart([{ weight: 100, quantity: 1 }], 50),
        address('FR')
      );
      expect(result).toBeNull();
    });
  });

  describe('Static methods', () => {
    it('getActiveShippingMethods returns only active methods sorted by displayOrder then name', async () => {
      await new ShippingMethod(validMethod({
        name: 'Express', code: 'EXP1', displayOrder: 1, isActive: true
      })).save();
      await new ShippingMethod(validMethod({
        name: 'Standard', code: 'STD1', displayOrder: 0, isActive: true
      })).save();
      await new ShippingMethod(validMethod({
        name: 'Disabled', code: 'OFF1', displayOrder: 0, isActive: false
      })).save();

      const active = await ShippingMethod.getActiveShippingMethods();
      const names = active.map(m => m.name);
      expect(names).toEqual(['Standard', 'Express']);
    });

    it('calculateRatesForCart returns eligible rates sorted cheapest first', async () => {
      await new ShippingMethod(validMethod({
        name: 'Express', code: 'EXP2', baseCost: 9.99
      })).save();
      await new ShippingMethod(validMethod({
        name: 'Standard', code: 'STD2', baseCost: 3.99
      })).save();

      const cartData = { items: [{ weight: 200, quantity: 1 }], totalValue: 50 };
      const rates = await ShippingMethod.calculateRatesForCart(cartData, { country: 'GB' });

      expect(rates).toHaveLength(2);
      // cheapest first
      expect(rates[0].name).toBe('Standard');
      expect(rates[0].cost).toBe(3.99);
      expect(rates[1].name).toBe('Express');
      // carries enriched fields
      expect(rates[0].code).toBe('STD2');
      expect(rates[0].estimatedDelivery).toBe('2-4 business days');
      expect(rates[0].details).toBeDefined();
    });

    it('calculateRatesForCart excludes ineligible methods (unsupported country)', async () => {
      await new ShippingMethod(validMethod({
        name: 'UK Only', code: 'UK1', baseCost: 3.99,
        criteria: { supportedCountries: ['GB'] }
      })).save();

      const cartData = { items: [{ weight: 200, quantity: 1 }], totalValue: 50 };
      const rates = await ShippingMethod.calculateRatesForCart(cartData, { country: 'US' });
      expect(rates).toHaveLength(0);
    });

    it('calculateRatesForCart returns empty array when no active methods exist', async () => {
      await new ShippingMethod(validMethod({
        name: 'Disabled', code: 'OFF2', isActive: false
      })).save();

      const cartData = { items: [{ weight: 200, quantity: 1 }], totalValue: 50 };
      const rates = await ShippingMethod.calculateRatesForCart(cartData, { country: 'GB' });
      expect(rates).toHaveLength(0);
    });
  });
});
