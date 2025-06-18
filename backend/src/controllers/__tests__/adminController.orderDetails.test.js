import { vi, describe, it, test, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import { getOrderById } from '../adminController.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

// Mock the models using vi.mock
vi.mock('../../models/User.js');
vi.mock('../../models/Order.js');

// Mock authentication middleware
vi.mock('../../middleware/auth.js', () => ({
  authenticate: vi.fn((req, res, next) => {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }
    
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
  }),
  requireRole: vi.fn((requiredRole) => (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  })
}));

const app = express();
app.use(express.json());
app.use('/api/admin/orders/:orderId', authenticate, requireRole('admin'), getOrderById);

describe('Admin Controller - getOrderById', () => {
  let adminToken;
  let mockOrder;

  beforeEach(() => {
    // Create admin token
    adminToken = jwt.sign(
      { userId: mongoose.Types.ObjectId(), role: 'admin' },
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // Mock order data
    mockOrder = {
      _id: mongoose.Types.ObjectId(),
      orderNumber: 'ORD-001',
      status: 'pending',
      totalAmount: 99.99,
      subtotalAmount: 89.99,
      shippingCost: 10.00,
      taxAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      paymentMethod: {
        type: 'card',
        last4: '1234'
      },
      paymentStatus: 'completed',
      paymentIntentId: 'pi_123',
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'London',
        postalCode: 'SW1A 1AA',
        country: 'UK'
      },
      billingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'London',
        postalCode: 'SW1A 1AA',
        country: 'UK'
      },
      shippingMethod: {
        name: 'Standard Delivery',
        cost: 10.00
      },
      items: [
        {
          _id: mongoose.Types.ObjectId(),
          productId: mongoose.Types.ObjectId(),
          name: 'Test Product',
          price: 89.99,
          quantity: 1,
          lineTotal: 89.99,
          image: 'test-image.jpg'
        }
      ],
      customer: {
        _id: mongoose.Types.ObjectId(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+44 123 456 7890'
      }
    };

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('GET /api/admin/orders/:orderId', () => {
    it('should return order details for valid order ID', async () => {
      // Mock User.findById to return admin user
      User.findById.mockResolvedValue({
        _id: mongoose.Types.ObjectId(),
        role: 'admin',
        email: 'admin@test.com'
      });

      // Mock Order.aggregate to return order
      Order.aggregate.mockResolvedValue([mockOrder]);

      const response = await request(app)
        .get(`/api/admin/orders/${mockOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toBeDefined();
      expect(response.body.data.order.orderNumber).toBe('ORD-001');
    });

    it('should return 404 for non-existent order', async () => {
      // Mock User.findById to return admin user
      User.findById.mockResolvedValue({
        _id: mongoose.Types.ObjectId(),
        role: 'admin',
        email: 'admin@test.com'
      });

      // Mock Order.aggregate to return empty array
      Order.aggregate.mockResolvedValue([]);

      const nonExistentId = mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/admin/orders/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order not found');
    });

    it('should return 400 for invalid order ID format', async () => {
      // Mock User.findById to return admin user
      User.findById.mockResolvedValue({
        _id: mongoose.Types.ObjectId(),
        role: 'admin',
        email: 'admin@test.com'
      });

      // Mock Order.aggregate to throw an error for invalid ObjectId
      Order.aggregate.mockRejectedValue(new Error('Cast to ObjectId failed'));

      const response = await request(app)
        .get('/api/admin/orders/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid order ID format');
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get(`/api/admin/orders/${mockOrder._id}`);

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      // Create customer token
      const customerToken = jwt.sign(
        { userId: mongoose.Types.ObjectId(), role: 'customer' },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      // Mock User.findById to return customer user
      User.findById.mockResolvedValue({
        _id: mongoose.Types.ObjectId(),
        role: 'customer',
        email: 'customer@test.com'
      });

      const response = await request(app)
        .get(`/api/admin/orders/${mockOrder._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });
  });
});