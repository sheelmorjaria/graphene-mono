import { vi, describe, it, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';

// Import dependencies
import Product from '../../models/Product.js';
import User from '../../models/User.js';

import Order from '../../models/Order.js';
import ReturnRequest from '../../models/ReturnRequest.js';
import emailService from '../../services/emailService.js';
import adminRouter from '../../routes/admin.js';

// Mock authentication middleware
vi.mock('../../middleware/auth.js', () => ({
  authenticate: vi.fn((req, res, next) => {
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
  requireRole: vi.fn((role) => (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    next();
  })
}));

// Create Express app
const app = express();
app.use(express.json());
app.use('/api/admin', adminRouter);

// Mock admin user
const mockAdminUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'admin@example.com',
  role: 'admin'
};

// Generate valid JWT tokens (must match auth middleware secret)
const validToken = jwt.sign(
  { userId: mockAdminUser._id, role: 'admin' },
  process.env.JWT_SECRET || 'your-secret-key'
);

const customerToken = jwt.sign(
  { userId: 'customer-id-123', role: 'customer' },
  process.env.JWT_SECRET || 'your-secret-key'
);

describe('Admin Products API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up mocks for Product model (will be overridden in specific tests)
    vi.spyOn(Product, 'find').mockImplementation(() => ({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([])
    }));
    
    vi.spyOn(Product, 'countDocuments').mockResolvedValue(0);
    
    // Set up mocks for other models
    vi.spyOn(User, 'findByEmail').mockResolvedValue(null);
    
    // Mock User.findById to return admin user for the token's user ID
    vi.spyOn(User, 'findById').mockImplementation((id) => {
      if (id === '507f1f77bcf86cd799439011') {
        return Promise.resolve({
          _id: '507f1f77bcf86cd799439011',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          accountStatus: 'active',
          isActive: true
        });
      }
      if (id === 'customer-id-123') {
        return Promise.resolve({
          _id: 'customer-id-123',
          email: 'customer@example.com',
          firstName: 'Test',
          lastName: 'Customer',
          role: 'customer',
          accountStatus: 'active',
          isActive: true
        });
      }
      return Promise.resolve(null);
    });
    vi.spyOn(Order, 'find').mockResolvedValue([]);
    vi.spyOn(ReturnRequest, 'find').mockResolvedValue([]);
    
    // Set up email service mocks
    vi.spyOn(emailService, 'sendRefundConfirmationEmail').mockResolvedValue();
    vi.spyOn(emailService, 'sendOrderConfirmationEmail').mockResolvedValue();
  });

  describe('GET /api/admin/products', () => {
    const mockProducts = [
      {
        _id: '1',
        name: 'Google Pixel 7',
        sku: 'GP7-001',
        price: 599,
        stockQuantity: 50,
        status: 'active',
        category: 'smartphone',
        images: ['image1.jpg'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        _id: '2',
        name: 'Google Pixel 7 Pro',
        sku: 'GP7P-001',
        price: 899,
        stockQuantity: 0,
        status: 'active',
        category: 'smartphone',
        images: ['image2.jpg'],
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z'
      }
    ];

    const setupProductMocks = () => {
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockProducts)
      };
      
      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(2);
      
      return mockQuery;
    };

    it('should return paginated products list', async () => {
      setupProductMocks();

      const response = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          products: mockProducts,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 2,
            itemsPerPage: 10,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });

      expect(Product.find).toHaveBeenCalledWith({ 
        status: { $ne: "archived" } 
      });
      expect(Product.countDocuments).toHaveBeenCalledWith({ 
        status: { $ne: "archived" } 
      });
    });

    it('should handle pagination parameters', async () => {
      const mockQuery = setupProductMocks();

      await request(app)
        .get('/api/admin/products?page=2&limit=5')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(mockQuery.skip).toHaveBeenCalledWith(5);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
    });

    it('should search by name and SKU', async () => {
      setupProductMocks();

      await request(app)
        .get('/api/admin/products?searchQuery=pixel')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Product.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'pixel', $options: 'i' } },
          { sku: { $regex: 'pixel', $options: 'i' } }
        ],
        status: { $ne: "archived" }
      });
    });

    it('should filter by category', async () => {
      setupProductMocks();

      await request(app)
        .get('/api/admin/products?category=smartphone')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Product.find).toHaveBeenCalledWith({
        category: 'smartphone',
        status: { $ne: "archived" }
      });
    });

    it('should filter by status', async () => {
      setupProductMocks();

      await request(app)
        .get('/api/admin/products?status=active')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Product.find).toHaveBeenCalledWith({
        status: 'active'
      });
    });

    it('should filter by price range', async () => {
      setupProductMocks();

      await request(app)
        .get('/api/admin/products?minPrice=500&maxPrice=800')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Product.find).toHaveBeenCalledWith({
        price: { $gte: 500, $lte: 800 },
        status: { $ne: "archived" }
      });
    });

    it('should filter by stock status - in stock', async () => {
      setupProductMocks();

      await request(app)
        .get('/api/admin/products?stockStatus=in_stock')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Product.find).toHaveBeenCalledWith({
        stockQuantity: { $gt: 0 },
        status: { $ne: "archived" }
      });
    });

    it('should filter by stock status - out of stock', async () => {
      setupProductMocks();

      await request(app)
        .get('/api/admin/products?stockStatus=out_of_stock')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Product.find).toHaveBeenCalledWith({
        stockQuantity: 0,
        status: { $ne: "archived" }
      });
    });

    it('should filter by stock status - low stock', async () => {
      setupProductMocks();

      await request(app)
        .get('/api/admin/products?stockStatus=low_stock')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Product.find).toHaveBeenCalledWith({
        stockQuantity: { $gt: 0, $lte: 10 },
        status: { $ne: "archived" }
      });
    });

    it('should sort by different fields', async () => {
      const mockQuery = setupProductMocks();

      await request(app)
        .get('/api/admin/products?sortBy=price&sortOrder=asc')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith({ price: 1 });
    });

    it('should handle multiple filters and search', async () => {
      setupProductMocks();

      await request(app)
        .get('/api/admin/products?searchQuery=pixel&category=smartphone&status=active&minPrice=500')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Product.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'pixel', $options: 'i' } },
          { sku: { $regex: 'pixel', $options: 'i' } }
        ],
        category: 'smartphone',
        status: 'active',
        price: { $gte: 500 }
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/admin/products')
        .expect(401);
    });

    it('should require admin role', async () => {
      // Create a token for a non-admin user
      const customerToken = jwt.sign(
        { userId: mockAdminUser._id, role: 'customer' },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should handle database errors', async () => {
      Product.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Server error while fetching products'
      });
    });
  });
});