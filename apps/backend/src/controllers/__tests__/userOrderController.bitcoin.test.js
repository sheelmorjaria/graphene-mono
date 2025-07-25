import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { placeOrder } from '../userOrderController.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import ShippingMethod from '../../models/ShippingMethod.js';
import Cart from '../../models/Cart.js';

// Mock dependencies
vi.mock('../../models/Order.js');
vi.mock('../../models/Product.js');
vi.mock('../../models/ShippingMethod.js');
vi.mock('../../models/Cart.js');

describe('User Order Controller - Bitcoin Orders', () => {
  let mockReq, mockRes, mockSession;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock mongoose session
    mockSession = {
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn(),
      endSession: vi.fn()
    };
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);

    // Mock request object for Bitcoin payment
    mockReq = {
      user: { _id: 'user123', email: 'test@example.com' },
      body: {
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          city: 'London',
          stateProvince: 'England',
          postalCode: 'SW1A 1AA',
          country: 'United Kingdom',
          phoneNumber: '+44123456789'
        },
        shippingMethodId: 'shipping123',
        paymentMethod: {
          type: 'bitcoin',
          name: 'Bitcoin'
        },
        useSameAsShipping: true
      }
    };

    // Mock response object
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully create Bitcoin order without PayPal order ID', async () => {
    // Mock cart with items
    const mockCart = {
      items: [
        { productId: 'prod1', quantity: 1 }
      ]
    };

    // Mock product
    const mockProduct = {
      _id: 'prod1',
      name: 'Test Product',
      price: 100,
      stockQuantity: 10,
      images: ['test.jpg'],
      slug: 'test-product'
    };

    // Mock shipping method
    const mockShippingMethod = {
      _id: 'shipping123',
      name: 'Standard Shipping',
      cost: 10,
      estimatedDelivery: '5-7 business days'
    };

    // Mock order creation
    const mockOrder = {
      _id: 'order123',
      userId: 'user123',
      paymentStatus: 'pending',
      status: 'pending',
      save: vi.fn()
    };

    // Setup mocks
    vi.spyOn(Cart, 'findOne').mockResolvedValue(mockCart);
    vi.spyOn(Product, 'find').mockResolvedValue([mockProduct]);
    vi.spyOn(Product, 'findByIdAndUpdate').mockResolvedValue(mockProduct);
    vi.spyOn(ShippingMethod, 'findOne').mockResolvedValue(mockShippingMethod);
    vi.spyOn(Order.prototype, 'constructor').mockImplementation(() => mockOrder);
    vi.spyOn(Order.prototype, 'save').mockResolvedValue(mockOrder);
    vi.spyOn(Cart, 'findOneAndUpdate').mockResolvedValue({});

    // Mock shipping calculation
    const mockShippingCalculation = { cost: 10, isAvailable: true };
    // This would normally come from a shipping service, but we'll mock it
    vi.spyOn(mockShippingMethod, 'calculateShipping').mockResolvedValue(mockShippingCalculation);

    await placeOrder(mockReq, mockRes);

    // Verify success response
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Order placed successfully',
        data: expect.objectContaining({
          order: expect.objectContaining({
            _id: 'order123'
          })
        })
      })
    );

    // Verify session transaction
    expect(mockSession.startTransaction).toHaveBeenCalled();
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });

  it('should reject order without payment method', async () => {
    // Remove payment method from request
    delete mockReq.body.paymentMethod;

    await placeOrder(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Payment method is required'
    });
  });

  it('should reject order with invalid payment method type', async () => {
    // Set invalid payment method
    mockReq.body.paymentMethod = {
      type: 'invalid',
      name: 'Invalid Payment'
    };

    await placeOrder(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unsupported payment method'
    });
  });

  it('should accept Bitcoin payment method without PayPal order ID', async () => {
    // Ensure no PayPal order ID is present
    expect(mockReq.body.paypalOrderId).toBeUndefined();
    expect(mockReq.body.paymentMethod.type).toBe('bitcoin');

    // Mock minimal dependencies for validation test
    vi.spyOn(Cart, 'findOne').mockResolvedValue({
      items: [{ productId: 'prod1', quantity: 1 }]
    });

    await placeOrder(mockReq, mockRes);

    // Should not fail with PayPal validation error
    expect(mockRes.json).not.toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('PayPal')
      })
    );
  });
});