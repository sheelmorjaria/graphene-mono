import { describe, it, expect } from 'vitest';
import { validationResult } from 'express-validator';
import { 
  createOrderValidation, 
  updateOrderStatusValidation, 
  refundOrderValidation 
} from '../orderValidators.js';

// Helper function to run validation
const runValidation = async (validations, req) => {
  await Promise.all(validations.map(validation => validation.run(req)));
  return validationResult(req);
};

// Mock request object helper
const createMockReq = (body = {}, params = {}, query = {}) => ({
  body,
  params,
  query
});

describe('Order Validators', () => {
  describe('createOrderValidation', () => {
    const validOrderData = {
      items: [
        {
          product: '507f1f77bcf86cd799439011',
          quantity: 2
        }
      ],
      shippingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Main St',
        city: 'London',
        postalCode: 'SW1A 1AA',
        country: 'GB'
      },
      paymentMethod: 'paypal'
    };

    it('should pass validation with valid order data', async () => {
      const req = createMockReq(validOrderData);
      const result = await runValidation(createOrderValidation, req);
      
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when items array is empty', async () => {
      const req = createMockReq({
        ...validOrderData,
        items: []
      });
      const result = await runValidation(createOrderValidation, req);
      
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Order must contain at least one item'
          })
        ])
      );
    });

    it('should fail when items array is missing', async () => {
      const req = createMockReq({
        ...validOrderData,
        items: undefined
      });
      const result = await runValidation(createOrderValidation, req);
      
      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with invalid product ObjectId', async () => {
      const req = createMockReq({
        ...validOrderData,
        items: [
          {
            product: 'invalid-id',
            quantity: 2
          }
        ]
      });
      const result = await runValidation(createOrderValidation, req);
      
      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with invalid quantity (too low)', async () => {
      const req = createMockReq({
        ...validOrderData,
        items: [
          {
            product: '507f1f77bcf86cd799439011',
            quantity: 0
          }
        ]
      });
      const result = await runValidation(createOrderValidation, req);
      
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Quantity must be between 1 and 100'
          })
        ])
      );
    });

    it('should fail with invalid quantity (too high)', async () => {
      const req = createMockReq({
        ...validOrderData,
        items: [
          {
            product: '507f1f77bcf86cd799439011',
            quantity: 101
          }
        ]
      });
      const result = await runValidation(createOrderValidation, req);
      
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Quantity must be between 1 and 100'
          })
        ])
      );
    });

    describe('Shipping Address Validation', () => {
      it('should fail when shipping address is missing', async () => {
        const req = createMockReq({
          ...validOrderData,
          shippingAddress: undefined
        });
        const result = await runValidation(createOrderValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Shipping address is required'
            })
          ])
        );
      });

      it('should fail when fullName is empty', async () => {
        const req = createMockReq({
          ...validOrderData,
          shippingAddress: {
            ...validOrderData.shippingAddress,
            fullName: ''
          }
        });
        const result = await runValidation(createOrderValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Full name is required'
            })
          ])
        );
      });

      it('should fail when fullName is too long', async () => {
        const req = createMockReq({
          ...validOrderData,
          shippingAddress: {
            ...validOrderData.shippingAddress,
            fullName: 'a'.repeat(101)
          }
        });
        const result = await runValidation(createOrderValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Full name is too long'
            })
          ])
        );
      });

      it('should fail when addressLine1 is empty', async () => {
        const req = createMockReq({
          ...validOrderData,
          shippingAddress: {
            ...validOrderData.shippingAddress,
            addressLine1: ''
          }
        });
        const result = await runValidation(createOrderValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Address line 1 is required'
            })
          ])
        );
      });

      it('should fail when city is empty', async () => {
        const req = createMockReq({
          ...validOrderData,
          shippingAddress: {
            ...validOrderData.shippingAddress,
            city: ''
          }
        });
        const result = await runValidation(createOrderValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'City is required'
            })
          ])
        );
      });

      it('should fail with invalid postal code format', async () => {
        const req = createMockReq({
          ...validOrderData,
          shippingAddress: {
            ...validOrderData.shippingAddress,
            postalCode: 'invalid!@#'
          }
        });
        const result = await runValidation(createOrderValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Invalid postal code format'
            })
          ])
        );
      });

      it('should pass with valid postal codes', async () => {
        const postalCodes = ['SW1A 1AA', '12345', 'K1A 0A6', '10115'];
        
        for (const postalCode of postalCodes) {
          const req = createMockReq({
            ...validOrderData,
            shippingAddress: {
              ...validOrderData.shippingAddress,
              postalCode
            }
          });
          const result = await runValidation(createOrderValidation, req);
          
          expect(result.isEmpty()).toBe(true);
        }
      });

      it('should fail with invalid country code', async () => {
        const req = createMockReq({
          ...validOrderData,
          shippingAddress: {
            ...validOrderData.shippingAddress,
            country: 'USA' // Should be 2-letter code
          }
        });
        const result = await runValidation(createOrderValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Country must be 2-letter ISO code'
            })
          ])
        );
      });
    });

    describe('Payment Method Validation', () => {
      it('should fail when payment method is empty', async () => {
        const req = createMockReq({
          ...validOrderData,
          paymentMethod: ''
        });
        const result = await runValidation(createOrderValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Payment method is required'
            })
          ])
        );
      });

      it('should fail with invalid payment method', async () => {
        const req = createMockReq({
          ...validOrderData,
          paymentMethod: 'stripe'
        });
        const result = await runValidation(createOrderValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Invalid payment method'
            })
          ])
        );
      });

      it('should pass with valid payment methods', async () => {
        const paymentMethods = ['paypal', 'bitcoin', 'monero'];
        
        for (const paymentMethod of paymentMethods) {
          const req = createMockReq({
            ...validOrderData,
            paymentMethod
          });
          const result = await runValidation(createOrderValidation, req);
          
          expect(result.isEmpty()).toBe(true);
        }
      });
    });

    it('should pass with optional cartId', async () => {
      const req = createMockReq({
        ...validOrderData,
        cartId: '507f1f77bcf86cd799439011'
      });
      const result = await runValidation(createOrderValidation, req);
      
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid cartId', async () => {
      const req = createMockReq({
        ...validOrderData,
        cartId: 'invalid-id'
      });
      const result = await runValidation(createOrderValidation, req);
      
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('updateOrderStatusValidation', () => {
    it('should pass with valid order status update', async () => {
      const req = createMockReq(
        { status: 'shipped', trackingNumber: 'TRK123456' },
        { orderId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(updateOrderStatusValidation, req);
      
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid orderId', async () => {
      const req = createMockReq(
        { status: 'shipped' },
        { orderId: 'invalid-id' }
      );
      const result = await runValidation(updateOrderStatusValidation, req);
      
      expect(result.isEmpty()).toBe(false);
    });

    it('should fail when status is empty', async () => {
      const req = createMockReq(
        { status: '' },
        { orderId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(updateOrderStatusValidation, req);
      
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Status is required'
          })
        ])
      );
    });

    it('should fail with invalid status', async () => {
      const req = createMockReq(
        { status: 'invalid-status' },
        { orderId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(updateOrderStatusValidation, req);
      
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Invalid order status'
          })
        ])
      );
    });

    it('should pass with all valid statuses', async () => {
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      
      for (const status of validStatuses) {
        const req = createMockReq(
          { status },
          { orderId: '507f1f77bcf86cd799439011' }
        );
        const result = await runValidation(updateOrderStatusValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      }
    });

    it('should pass without optional tracking number', async () => {
      const req = createMockReq(
        { status: 'processing' },
        { orderId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(updateOrderStatusValidation, req);
      
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid tracking number format', async () => {
      const req = createMockReq(
        { status: 'shipped', trackingNumber: 'invalid!@#' },
        { orderId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(updateOrderStatusValidation, req);
      
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Invalid tracking number format'
          })
        ])
      );
    });

    it('should pass with valid tracking number formats', async () => {
      const validTrackingNumbers = ['TRK123456', '1Z999AA1234567890', 'AB123-456-CD'];
      
      for (const trackingNumber of validTrackingNumbers) {
        const req = createMockReq(
          { status: 'shipped', trackingNumber },
          { orderId: '507f1f77bcf86cd799439011' }
        );
        const result = await runValidation(updateOrderStatusValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      }
    });
  });

  describe('refundOrderValidation', () => {
    it('should pass with valid refund data', async () => {
      const req = createMockReq(
        { 
          amount: 50.00,
          reason: 'Customer requested refund due to defective product'
        },
        { orderId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(refundOrderValidation, req);
      
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid orderId', async () => {
      const req = createMockReq(
        { amount: 50.00, reason: 'Test reason' },
        { orderId: 'invalid-id' }
      );
      const result = await runValidation(refundOrderValidation, req);
      
      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with negative amount', async () => {
      const req = createMockReq(
        { amount: -10, reason: 'Test reason' },
        { orderId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(refundOrderValidation, req);
      
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Refund amount must be greater than 0'
          })
        ])
      );
    });

    it('should fail with zero amount', async () => {
      const req = createMockReq(
        { amount: 0, reason: 'Test reason' },
        { orderId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(refundOrderValidation, req);
      
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Refund amount must be greater than 0'
          })
        ])
      );
    });

    it('should fail when reason is empty', async () => {
      const req = createMockReq(
        { amount: 50.00, reason: '' },
        { orderId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(refundOrderValidation, req);
      
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Refund reason is required'
          })
        ])
      );
    });

    it('should fail when reason is too long', async () => {
      const req = createMockReq(
        { 
          amount: 50.00, 
          reason: 'a'.repeat(501) 
        },
        { orderId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(refundOrderValidation, req);
      
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Refund reason is too long'
          })
        ])
      );
    });

    it('should pass with maximum length reason', async () => {
      const req = createMockReq(
        { 
          amount: 50.00, 
          reason: 'a'.repeat(500) 
        },
        { orderId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(refundOrderValidation, req);
      
      expect(result.isEmpty()).toBe(true);
    });
  });
});