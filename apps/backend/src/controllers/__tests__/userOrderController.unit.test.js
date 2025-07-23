import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getUserOrders, getUserOrderDetails, placeOrder, cancelOrder, getEligibleReturnItems } from '../userOrderController.js';
import Order from '../../models/Order.js';
import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';
import ShippingMethod from '../../models/ShippingMethod.js';
import emailService from '../../services/emailService.js';

// Mock all dependencies
vi.mock('../../models/Order.js');
vi.mock('../../models/Cart.js');
vi.mock('../../models/Product.js');
vi.mock('../../models/ShippingMethod.js');
vi.mock('../../services/emailService.js');

describe('User Order Controller - Unit Tests', () => {
  let req, res, next;
  let mockUser;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUser = {
      _id: '123456789012345678901234',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe'
    };

    req = {
      user: mockUser,
      params: {},
      query: {},
      body: {}
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
      setHeader: vi.fn()
    };

    next = vi.fn();
  });

  describe('getUserOrders', () => {
    it('should return user orders with default pagination', async () => {
      const mockOrders = [
        {
          _id: '111111111111111111111111',
          orderNumber: 'ORD001',
          orderDate: new Date('2023-01-01'),
          totalAmount: 100,
          status: 'delivered',
          items: [{ productId: '123' }],
          getStatusDisplay: vi.fn().mockReturnValue('Delivered'),
          getFormattedDate: vi.fn().mockReturnValue('Jan 1, 2023')
        }
      ];

      Order.findByUser = vi.fn().mockResolvedValue(mockOrders);
      Order.countByUser = vi.fn().mockResolvedValue(1);

      await getUserOrders(req, res);

      expect(Order.findByUser).toHaveBeenCalledWith(mockUser._id, {
        page: 1,
        limit: 10,
        sortBy: 'orderDate',
        sortOrder: -1
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          orders: expect.arrayContaining([
            expect.objectContaining({
              _id: '111111111111111111111111',
              orderNumber: 'ORD001',
              status: 'delivered'
            })
          ]),
          pagination: expect.objectContaining({
            currentPage: 1,
            totalPages: 1,
            totalOrders: 1
          })
        }
      });
    });

    it('should handle database errors', async () => {
      Order.findByUser = vi.fn().mockRejectedValue(new Error('Database error'));

      await getUserOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while fetching orders'
      });
    });
  });

  describe('getUserOrderDetails', () => {
    it('should return order details for valid order', async () => {
      req.params.orderId = '111111111111111111111111';

      const mockOrder = {
        _id: '111111111111111111111111',
        orderNumber: 'ORD001',
        orderDate: new Date('2023-01-01'),
        totalAmount: 100,
        status: 'delivered',
        items: [{
          productId: { name: 'Product 1', currentPrice: 50 },
          quantity: 2,
          price: 50,
          subtotal: 100
        }],
        getStatusDisplay: vi.fn().mockReturnValue('Delivered'),
        getFormattedDate: vi.fn().mockReturnValue('Jan 1, 2023')
      };

      Order.findOne = vi.fn().mockResolvedValue(mockOrder);

      await getUserOrderDetails(req, res);

      expect(Order.findOne).toHaveBeenCalledWith({
        _id: '111111111111111111111111',
        userId: mockUser._id
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          order: expect.objectContaining({
            _id: '111111111111111111111111',
            orderNumber: 'ORD001',
            status: 'delivered'
          })
        }
      });
    });

    it('should return 400 for invalid order ID format', async () => {
      req.params.orderId = 'invalid-id';

      await getUserOrderDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid order ID format'
      });
    });

    it('should return 404 for non-existent order', async () => {
      req.params.orderId = '111111111111111111111111';
      Order.findOne = vi.fn().mockResolvedValue(null);

      await getUserOrderDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found'
      });
    });
  });

  describe('placeOrder', () => {
    it('should place order successfully', async () => {
      req.body = {
        shippingAddress: {
          street: '123 Main St',
          city: 'London',
          country: 'UK',
          postalCode: 'SW1A 1AA'
        },
        paymentMethod: 'card'
      };

      const mockCart = {
        _id: '333333333333333333333333',
        items: [{
          productId: '444444444444444444444444',
          quantity: 2,
          price: 50
        }],
        getTotalAmount: vi.fn().mockReturnValue(100)
      };

      const mockOrder = {
        _id: '111111111111111111111111',
        orderNumber: 'ORD001',
        save: vi.fn().mockResolvedValue(true)
      };

      Cart.findOne = vi.fn().mockResolvedValue(mockCart);
      Order.prototype.save = vi.fn().mockResolvedValue(mockOrder);

      await placeOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Order placed successfully',
        data: expect.objectContaining({
          orderId: '111111111111111111111111',
          orderNumber: 'ORD001'
        })
      });
    });

    it('should handle empty cart', async () => {
      req.body = {
        shippingAddress: {
          street: '123 Main St',
          city: 'London',
          country: 'UK'
        }
      };

      Cart.findOne = vi.fn().mockResolvedValue(null);

      await placeOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cart is empty or not found'
      });
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order successfully', async () => {
      req.params.orderId = '111111111111111111111111';
      req.body.reason = 'Changed my mind';

      const mockOrder = {
        _id: '111111111111111111111111',
        orderNumber: 'ORD001',
        status: 'pending',
        userId: mockUser._id,
        canBeCancelled: vi.fn().mockReturnValue(true),
        save: vi.fn().mockResolvedValue(true)
      };

      Order.findOne = vi.fn().mockResolvedValue(mockOrder);
      emailService.sendOrderCancellationEmail = vi.fn().mockResolvedValue();

      await cancelOrder(req, res);

      expect(mockOrder.status).toBe('cancelled');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Order cancelled successfully'
      });
    });

    it('should handle invalid order ID', async () => {
      req.params.orderId = 'invalid-id';
      req.body.reason = 'Test reason';

      await cancelOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid order ID format'
      });
    });

    it('should handle non-existent order', async () => {
      req.params.orderId = '111111111111111111111111';
      req.body.reason = 'Test reason';
      Order.findOne = vi.fn().mockResolvedValue(null);

      await cancelOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found'
      });
    });
  });

  describe('getEligibleReturnItems', () => {
    it('should return eligible return items', async () => {
      req.params.orderId = '111111111111111111111111';

      const mockOrder = {
        _id: '111111111111111111111111',
        status: 'delivered',
        userId: mockUser._id,
        items: [{
          productId: '444444444444444444444444',
          quantity: 2,
          price: 50,
          canBeReturned: true
        }],
        getEligibleReturnItems: vi.fn().mockReturnValue([{
          productId: '444444444444444444444444',
          quantity: 2,
          price: 50,
          canBeReturned: true
        }])
      };

      Order.findOne = vi.fn().mockResolvedValue(mockOrder);

      await getEligibleReturnItems(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          eligibleItems: expect.arrayContaining([
            expect.objectContaining({
              productId: '444444444444444444444444',
              quantity: 2,
              canBeReturned: true
            })
          ])
        }
      });
    });

    it('should handle invalid order ID', async () => {
      req.params.orderId = 'invalid-id';

      await getEligibleReturnItems(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid order ID format'
      });
    });

    it('should handle non-existent order', async () => {
      req.params.orderId = '111111111111111111111111';
      Order.findOne = vi.fn().mockResolvedValue(null);

      await getEligibleReturnItems(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found'
      });
    });
  });
});