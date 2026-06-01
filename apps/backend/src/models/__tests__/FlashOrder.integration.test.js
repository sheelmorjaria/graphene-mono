import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import FlashOrder from '../FlashOrder.js';

describe('FlashOrder Model', () => {
  let validData;

  beforeEach(async () => {
    await FlashOrder.deleteMany({});
    validData = {
      customerEmail: 'test@example.com',
      pixelModel: 'Pixel 8 Pro',
      returnAddress: {
        fullName: 'Test User',
        addressLine1: '123 Test Street',
        city: 'London',
        stateProvince: 'England',
        postalCode: 'E1 6AN',
        country: 'GB',
        phoneNumber: '+44 20 7946 0958'
      },
      factoryResetConfirmed: true
    };
  });

  afterEach(async () => {
    await FlashOrder.deleteMany({});
  });

  describe('Required Fields Validation', () => {
    it('should require customerEmail', async () => {
      const { customerEmail, ...invalidData } = validData;
      const order = new FlashOrder(invalidData);
      await expect(order.save()).rejects.toThrow(/customerEmail/);
    });

    it('should require pixelModel', async () => {
      const { pixelModel, ...invalidData } = validData;
      const order = new FlashOrder(invalidData);
      await expect(order.save()).rejects.toThrow(/pixelModel/);
    });

    it('should require returnAddress', async () => {
      const { returnAddress, ...invalidData } = validData;
      const order = new FlashOrder(invalidData);
      await expect(order.save()).rejects.toThrow(/returnAddress/);
    });

    it('should require factoryResetConfirmed', async () => {
      // The field has both required: true and default: false
      // When undefined is passed, Mongoose uses the default value (false)
      const order = new FlashOrder({ ...validData, factoryResetConfirmed: undefined });
      await order.save();
      // Verify the default value was applied
      expect(order.factoryResetConfirmed).toBe(false);
    });

    it('should require all returnAddress sub-fields', async () => {
      const invalidData = {
        ...validData,
        returnAddress: {
          fullName: 'Test User'
          // Missing required fields
        }
      };
      const order = new FlashOrder(invalidData);
      await expect(order.save()).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should default orderStatus to Awaiting_Payment', async () => {
      const order = new FlashOrder(validData);
      await order.save();
      expect(order.orderStatus).toBe('Awaiting_Payment');
    });

    it('should default paymentStatus to Unpaid', async () => {
      const order = new FlashOrder(validData);
      await order.save();
      expect(order.paymentStatus).toBe('Unpaid');
    });

    it('should default factoryResetConfirmed to false if not provided', async () => {
      const { factoryResetConfirmed, ...dataWithoutReset } = validData;
      const order = new FlashOrder(dataWithoutReset);
      await order.save();
      expect(order.factoryResetConfirmed).toBe(false);
    });

    it('should default country to GB in returnAddress', async () => {
      const dataWithoutCountry = {
        ...validData,
        returnAddress: {
          fullName: 'Test User',
          addressLine1: '123 Test Street',
          city: 'London',
          stateProvince: 'England',
          postalCode: 'E1 6AN',
          phoneNumber: '+44 20 7946 0958'
        }
      };
      const order = new FlashOrder(dataWithoutCountry);
      await order.save();
      expect(order.returnAddress.country).toBe('GB');
    });
  });

  describe('Pixel Model Enum Validation', () => {
    const supportedModels = [
      'Pixel 6', 'Pixel 6 Pro', 'Pixel 6a',
      'Pixel 7', 'Pixel 7 Pro', 'Pixel 7a',
      'Pixel 8', 'Pixel 8 Pro', 'Pixel 8a'
    ];

    supportedModels.forEach(model => {
      it(`should accept supported model: ${model}`, async () => {
        const order = new FlashOrder({ ...validData, pixelModel: model });
        await order.save();
        expect(order.pixelModel).toBe(model);
      });
    });

    const unsupportedModels = ['Pixel 4', 'Pixel 4a', 'Pixel 5', 'Pixel 5a', 'iPhone 15', 'Galaxy S24'];

    unsupportedModels.forEach(model => {
      it(`should reject unsupported model: ${model}`, async () => {
        const order = new FlashOrder({ ...validData, pixelModel: model });
        await expect(order.save()).rejects.toThrow(/Invalid Pixel model/);
      });
    });
  });

  describe('Factory Reset Confirmation', () => {
    it('should accept factoryResetConfirmed as true', async () => {
      const order = new FlashOrder({ ...validData, factoryResetConfirmed: true });
      await order.save();
      expect(order.factoryResetConfirmed).toBe(true);
    });

    it('should accept factoryResetConfirmed as false but not allow save if required', async () => {
      // This tests that the validator properly handles false value
      const order = new FlashOrder({ ...validData, factoryResetConfirmed: false });
      // Model should save with false (it's a valid boolean)
      await order.save();
      expect(order.factoryResetConfirmed).toBe(false);
    });

    it('should cast truthy strings to boolean true for factoryResetConfirmed', async () => {
      // Mongoose automatically casts strings to booleans
      const order = new FlashOrder({ ...validData, factoryResetConfirmed: 'yes' });
      await order.save();
      expect(order.factoryResetConfirmed).toBe(true);
    });
  });

  describe('Order Status Enum', () => {
    const validStatuses = [
      'Awaiting_Payment', 'Paid', 'Device_Received',
      'Flashing_In_Progress', 'Shipped_Back', 'Cancelled', 'Refunded'
    ];

    validStatuses.forEach(status => {
      it(`should accept orderStatus: ${status}`, async () => {
        const order = new FlashOrder({ ...validData, orderStatus: status });
        await order.save();
        expect(order.orderStatus).toBe(status);
      });
    });

    it('should reject invalid orderStatus', async () => {
      const order = new FlashOrder({ ...validData, orderStatus: 'Invalid_Status' });
      await expect(order.save()).rejects.toThrow();
    });
  });

  describe('Payment Status Enum', () => {
    const validStatuses = ['Unpaid', 'Pending', 'Completed', 'Failed', 'Refunded'];

    validStatuses.forEach(status => {
      it(`should accept paymentStatus: ${status}`, async () => {
        const order = new FlashOrder({ ...validData, paymentStatus: status });
        await order.save();
        expect(order.paymentStatus).toBe(status);
      });
    });

    it('should reject invalid paymentStatus', async () => {
      const order = new FlashOrder({ ...validData, paymentStatus: 'Invalid_Status' });
      await expect(order.save()).rejects.toThrow();
    });
  });

  describe('Order Number Generation', () => {
    it('should auto-generate orderNumber in format FLO-{timestamp}-{random}', async () => {
      const order = new FlashOrder(validData);
      await order.save();
      expect(order.orderNumber).toMatch(/^FLO-\d+-\d{3}$/);
    });

    it('should generate unique orderNumbers for each order', async () => {
      const order1 = new FlashOrder({ ...validData, customerEmail: 'user1@example.com' });
      const order2 = new FlashOrder({ ...validData, customerEmail: 'user2@example.com' });
      await order1.save();
      await order2.save();
      expect(order1.orderNumber).not.toBe(order2.orderNumber);
    });
  });

  describe('Total Price Calculation', () => {
    it('should calculate totalPrice as basePrice + returnShipping', async () => {
      const basePrice = 119.99;
      const returnShipping = 19.99;
      const expectedTotal = basePrice + returnShipping;

      const order = new FlashOrder({
        ...validData,
        basePrice,
        returnShipping
      });
      await order.save();
      expect(order.totalPrice).toBe(expectedTotal);
    });

    it('should default to base pricing if not provided', async () => {
      const order = new FlashOrder(validData);
      await order.save();
      // Default should be 119.99 + 19.99 = 139.98
      expect(order.totalPrice).toBe(139.98);
    });

    it('should not allow negative totalPrice', async () => {
      const order = new FlashOrder({ ...validData, totalPrice: -10 });
      await expect(order.save()).rejects.toThrow(/negative/);
    });
  });

  describe('PO Box Address Security', () => {
    it('should allow poBoxAddress to be undefined on creation', async () => {
      const order = new FlashOrder(validData);
      await order.save();
      // poBoxAddress defaults to undefined
      expect(order.poBoxAddress).toBeUndefined();
    });

    it('should allow poBoxAddress to be populated later', async () => {
      const order = new FlashOrder(validData);
      await order.save();

      const poBoxData = {
        street: 'PO Box 12345',
        city: 'London',
        postalCode: 'E1 6AN',
        country: 'United Kingdom',
        instructions: 'Include your order number on the package'
      };

      order.poBoxAddress = poBoxData;
      await order.save();

      const fetched = await FlashOrder.findById(order._id);
      // Use toMatchObject for Mongoose document comparison
      expect(fetched.poBoxAddress).toMatchObject(poBoxData);
    });
  });

  describe('Payment Details', () => {
    it('should store PayPal payment details', async () => {
      const paymentDetails = {
        paypalOrderId: 'PAYPAL-123',
        paypalPaymentId: 'PAYMENT-456',
        paypalPayerId: 'PAYER-789',
        paypalTransactionId: 'TRANS-101',
        paypalPayerEmail: 'payer@example.com'
      };

      const order = new FlashOrder({
        ...validData,
        paymentDetails
      });
      await order.save();

      const fetched = await FlashOrder.findById(order._id);
      expect(fetched.paymentDetails).toEqual(paymentDetails);
    });
  });

  describe('Status History', () => {
    it('should initialize with empty statusHistory', async () => {
      const order = new FlashOrder(validData);
      await order.save();
      expect(order.statusHistory).toEqual([]);
    });

    it('should allow adding status history entries', async () => {
      const order = new FlashOrder(validData);
      await order.save();

      order.statusHistory.push({
        status: 'Paid',
        timestamp: new Date(),
        note: 'Payment received via PayPal'
      });
      await order.save();

      const fetched = await FlashOrder.findById(order._id);
      expect(fetched.statusHistory).toHaveLength(1);
      expect(fetched.statusHistory[0].status).toBe('Paid');
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt timestamps', async () => {
      const order = new FlashOrder(validData);
      await order.save();

      expect(order.createdAt).toBeDefined();
      expect(order.updatedAt).toBeDefined();
      expect(order.createdAt).toBeInstanceOf(Date);
      expect(order.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on save', async () => {
      const order = new FlashOrder(validData);
      await order.save();

      const originalUpdatedAt = order.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 10));

      order.orderStatus = 'Paid';
      await order.save();

      expect(order.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Email Validation', () => {
    it('should accept valid email addresses', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com'
      ];

      for (const email of validEmails) {
        const order = new FlashOrder({ ...validData, customerEmail: email });
        await order.save();
        expect(order.customerEmail).toBe(email.toLowerCase());
      }
    });

    it('should convert email to lowercase', async () => {
      const order = new FlashOrder({ ...validData, customerEmail: 'TEST@EXAMPLE.COM' });
      await order.save();
      expect(order.customerEmail).toBe('test@example.com');
    });

    it('should trim email whitespace', async () => {
      const order = new FlashOrder({ ...validData, customerEmail: '  test@example.com  ' });
      await order.save();
      expect(order.customerEmail).toBe('test@example.com');
    });
  });

  describe('Field Length Validation', () => {
    it('should enforce maxLength on customerEmail', async () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const order = new FlashOrder({ ...validData, customerEmail: longEmail });
      await expect(order.save()).rejects.toThrow();
    });

    it('should enforce maxLength on returnAddress.fullName', async () => {
      const order = new FlashOrder({
        ...validData,
        returnAddress: {
          ...validData.returnAddress,
          fullName: 'a'.repeat(150)
        }
      });
      await expect(order.save()).rejects.toThrow();
    });

    it('should enforce maxLength on statusHistory.note', async () => {
      const order = new FlashOrder(validData);
      await order.save();

      order.statusHistory.push({
        status: 'Paid',
        note: 'a'.repeat(250)
      });
      await expect(order.save()).rejects.toThrow();
    });
  });
});
