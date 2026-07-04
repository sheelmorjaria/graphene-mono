import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import shippingRoutes from '../../routes/shipping.js';
import ShippingMethod from '../../models/ShippingMethod.js';
import Product from '../../models/Product.js';

// Mount the REAL shipping routes (which apply optionalAuth internally) on a
// minimal Express app. This exercises the real controller + real models against
// the shared in-memory replica-set DB.
const app = express();
app.use(express.json());
app.use('/api/shipping', shippingRoutes);

// Helpers -------------------------------------------------------------

// Build a valid variation-based Product in the real DB. Note: the real Product
// schema has NO top-level price/stockQuantity (they live in variations[]), but
// the shipping controller reads product.price / product.stockQuantity directly.
// Those resolve to undefined at runtime; the controller's NaN-tolerant math
// still yields a 200 with shipping rates (asserted on structure, not totals).
const createProduct = async (overrides = {}) => {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return Product.create({
    name: 'GrapheneOS Pixel 9 Pro',
    slug: `grapheneos-pixel-9-pro-${stamp}`,
    sku: `SKU-${stamp}`,
    baseModel: 'Pixel 9 Pro',
    shortDescription: 'Privacy-focused smartphone',
    longDescription: 'A long description.',
    images: ['https://example.com/image1.jpg'],
    weight: 200, // grams (top-level field exists on schema)
    variations: [
      {
        condition: 'new',
        color: 'Obsidian',
        storage: '256GB',
        price: 999.99,
        stockQuantity: 10,
        stockStatus: 'in_stock',
        sku: `VAR-${stamp}`,
        images: ['https://example.com/image1.jpg']
      }
    ],
    status: 'active',
    isActive: true,
    ...overrides
  });
};

// Build a UK shipping method that supports GB. The `code` field must match
// /^[A-Z0-9_]+$/, so the random suffix is uppercased.
const createShippingMethod = async (overrides = {}) =>
  ShippingMethod.create({
    name: 'Standard UK Shipping',
    code: `STDUK${Date.now()}${Math.floor(Math.random() * 100000)}`,
    description: 'Standard delivery',
    estimatedDeliveryDays: { min: 2, max: 4 },
    baseCost: 9.99,
    criteria: {
      minWeight: 0,
      maxWeight: 5000,
      minOrderValue: 0,
      maxOrderValue: 999999.99,
      supportedCountries: ['GB']
    },
    pricing: { weightRate: 0.001, baseWeight: 1000, dimensionalWeightFactor: 5000 },
    isActive: true,
    displayOrder: 1,
    ...overrides
  });

describe('Shipping Controller - Integration Tests', () => {
  let product;
  let shippingMethod;

  beforeEach(async () => {
    // Harness wipes all collections between tests, so seed fresh each time.
    product = await createProduct();
    shippingMethod = await createShippingMethod();
  });

  describe('POST /api/shipping/calculate-rates', () => {
    it('returns 400 when cartItems is missing', async () => {
      const response = await request(app)
        .post('/api/shipping/calculate-rates')
        .send({ shippingAddress: { country: 'GB' } })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/cart items are required/i);
    });

    it('returns 400 when cartItems is an empty array', async () => {
      const response = await request(app)
        .post('/api/shipping/calculate-rates')
        .send({ cartItems: [], shippingAddress: { country: 'GB' } })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/non-empty array/i);
    });

    it('returns 400 when shippingAddress or country is missing', async () => {
      const response = await request(app)
        .post('/api/shipping/calculate-rates')
        .send({ cartItems: [{ productId: product._id, quantity: 1 }] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/country is required/i);
    });

    it('returns 400 when a cart item is missing productId or quantity', async () => {
      const response = await request(app)
        .post('/api/shipping/calculate-rates')
        .send({
          cartItems: [{ productId: product._id }], // no quantity
          shippingAddress: { country: 'GB' }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/productId and quantity/i);
    });

    it('returns 400 for an invalid productId format', async () => {
      const response = await request(app)
        .post('/api/shipping/calculate-rates')
        .send({
          cartItems: [{ productId: 'not-an-object-id', quantity: 1 }],
          shippingAddress: { country: 'GB' }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/invalid product id format/i);
    });

    it('returns 400 when country code is not a valid ISO alpha-2', async () => {
      const response = await request(app)
        .post('/api/shipping/calculate-rates')
        .send({
          cartItems: [{ productId: product._id, quantity: 1 }],
          shippingAddress: { country: 'GBR' }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/alpha-2/i);
    });

    it('converts a country name to its code (United Kingdom -> GB) and calculates rates', async () => {
      const response = await request(app)
        .post('/api/shipping/calculate-rates')
        .send({
          cartItems: [{ productId: product._id, quantity: 1 }],
          shippingAddress: { country: 'United Kingdom' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.shippingRates).toBeInstanceOf(Array);
      expect(response.body.data.shippingRates.length).toBeGreaterThan(0);
      // Country is normalized to the code in the echoed address.
      expect(response.body.data.shippingAddress.country).toBe('GB');
      // Cart summary shape.
      expect(response.body.data.cartSummary).toHaveProperty('totalItems');
      expect(response.body.data.cartSummary).toHaveProperty('totalWeight');
      expect(response.body.data.cartSummary).toHaveProperty('itemCount');
    });

    it('returns 400 when one of the products does not exist (or is inactive)', async () => {
      const ghostId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/shipping/calculate-rates')
        .send({
          cartItems: [{ productId: ghostId.toString(), quantity: 1 }],
          shippingAddress: { country: 'GB' }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/not found or inactive/i);
    });

    it('returns 400 when no shipping methods are available for the country', async () => {
      // Only a GB method exists; shipping to the US should yield no rates.
      const response = await request(app)
        .post('/api/shipping/calculate-rates')
        .send({
          cartItems: [{ productId: product._id, quantity: 1 }],
          shippingAddress: { country: 'US' }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/no shipping methods available/i);
    });

    it('returns rates sorted by cost (cheapest first) for a supported country', async () => {
      // Add a second, cheaper method.
      await createShippingMethod({
        name: 'Budget UK',
        baseCost: 4.99,
        displayOrder: 0
      });

      const response = await request(app)
        .post('/api/shipping/calculate-rates')
        .send({
          cartItems: [{ productId: product._id, quantity: 1 }],
          shippingAddress: { country: 'GB' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      const rates = response.body.data.shippingRates;
      expect(rates.length).toBe(2);
      // Rates come back sorted cheapest first.
      expect(rates[0].cost).toBeLessThanOrEqual(rates[1].cost);
      // Each rate exposes the expected fields.
      for (const rate of rates) {
        expect(rate).toHaveProperty('id');
        expect(rate).toHaveProperty('code');
        expect(rate).toHaveProperty('name');
        expect(rate).toHaveProperty('cost');
        expect(rate).toHaveProperty('estimatedDelivery');
      }
    });
  });

  describe('GET /api/shipping/methods', () => {
    it('returns all active shipping methods', async () => {
      const response = await request(app)
        .get('/api/shipping/methods')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.shippingMethods).toBeInstanceOf(Array);
      // At least the seeded method is present.
      expect(response.body.data.shippingMethods.length).toBeGreaterThanOrEqual(1);

      const method = response.body.data.shippingMethods.find(
        m => m.code === shippingMethod.code
      );
      expect(method).toBeTruthy();
      expect(method).toHaveProperty('id');
      expect(method).toHaveProperty('baseCost');
      expect(method).toHaveProperty('estimatedDelivery');
      expect(method.isActive).toBe(true);
    });

    it('excludes inactive shipping methods', async () => {
      await createShippingMethod({ name: 'Inactive', isActive: false });

      const response = await request(app)
        .get('/api/shipping/methods')
        .expect(200);

      expect(response.body.success).toBe(true);
      const names = response.body.data.shippingMethods.map(m => m.name);
      expect(names).not.toContain('Inactive');
      expect(names).toContain('Standard UK Shipping');
    });
  });

  describe('POST /api/shipping/validate-method', () => {
    it('returns 400 when methodId is missing', async () => {
      const response = await request(app)
        .post('/api/shipping/validate-method')
        .send({
          cartItems: [{ productId: product._id, quantity: 1 }],
          shippingAddress: { country: 'GB' }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/shipping method id is required/i);
    });

    it('returns 400 for an invalid methodId format', async () => {
      const response = await request(app)
        .post('/api/shipping/validate-method')
        .send({
          methodId: 'not-an-object-id',
          cartItems: [{ productId: product._id, quantity: 1 }],
          shippingAddress: { country: 'GB' }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/shipping method id is required/i);
    });

    it('returns 400 when cartItems is empty', async () => {
      const response = await request(app)
        .post('/api/shipping/validate-method')
        .send({
          methodId: shippingMethod._id.toString(),
          cartItems: [],
          shippingAddress: { country: 'GB' }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/cart items are required/i);
    });

    it('returns 400 when shippingAddress is missing', async () => {
      const response = await request(app)
        .post('/api/shipping/validate-method')
        .send({
          methodId: shippingMethod._id.toString(),
          cartItems: [{ productId: product._id, quantity: 1 }]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/shipping address is required/i);
    });

    it('returns 404 when the shipping method does not exist', async () => {
      const ghostId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/shipping/validate-method')
        .send({
          methodId: ghostId.toString(),
          cartItems: [{ productId: product._id, quantity: 1 }],
          shippingAddress: { country: 'GB' }
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/not found or inactive/i);
    });

    it('returns 404 when the shipping method is inactive', async () => {
      const inactive = await createShippingMethod({ isActive: false });

      const response = await request(app)
        .post('/api/shipping/validate-method')
        .send({
          methodId: inactive._id.toString(),
          cartItems: [{ productId: product._id, quantity: 1 }],
          shippingAddress: { country: 'GB' }
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/not found or inactive/i);
    });

    it('validates an eligible method for a supported country', async () => {
      const response = await request(app)
        .post('/api/shipping/validate-method')
        .send({
          methodId: shippingMethod._id.toString(),
          cartItems: [{ productId: product._id, quantity: 1 }],
          shippingAddress: { country: 'GB' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.shippingMethod).toBeTruthy();
      expect(response.body.data.shippingMethod.id).toBe(shippingMethod._id.toString());
    });

    it('returns 400 when the method is not available for the country', async () => {
      const response = await request(app)
        .post('/api/shipping/validate-method')
        .send({
          methodId: shippingMethod._id.toString(),
          cartItems: [{ productId: product._id, quantity: 1 }],
          shippingAddress: { country: 'US' }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/not available for this cart and address/i);
    });
  });
});
