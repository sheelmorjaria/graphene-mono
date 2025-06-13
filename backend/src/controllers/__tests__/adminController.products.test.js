import { jest } from '@jest/globals';
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

// Generate valid JWT token
const validToken = jwt.sign(
  { userId: mockAdminUser._id, role: 'admin' },
  process.env.JWT_SECRET || 'test-secret'
);

describe('Admin Products API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mocks for Product model
    jest.spyOn(Product, 'find').mockImplementation(() => ({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([])
    }));
    
    jest.spyOn(Product, 'countDocuments').mockResolvedValue(0);
    
    // Set up mocks for other models
    jest.spyOn(User, 'findByEmail').mockResolvedValue(null);
    jest.spyOn(User, 'findById').mockResolvedValue(null);
    jest.spyOn(Order, 'find').mockResolvedValue([]);
    jest.spyOn(ReturnRequest, 'find').mockResolvedValue([]);
    
    // Set up email service mocks
    jest.spyOn(emailService, 'sendRefundConfirmationEmail').mockResolvedValue();
    jest.spyOn(emailService, 'sendOrderConfirmationEmail').mockResolvedValue();
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
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
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
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ];

    const setupProductMocks = () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts)
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

      expect(Product.find).toHaveBeenCalledWith({});
      expect(Product.countDocuments).toHaveBeenCalledWith({});
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
        ]
      });
    });

    it('should filter by category', async () => {
      setupProductMocks();

      await request(app)
        .get('/api/admin/products?category=smartphone')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Product.find).toHaveBeenCalledWith({
        category: 'smartphone'
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
        price: { $gte: 500, $lte: 800 }
      });
    });

    it('should filter by stock status - in stock', async () => {
      setupProductMocks();

      await request(app)
        .get('/api/admin/products?stockStatus=in_stock')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Product.find).toHaveBeenCalledWith({
        stockQuantity: { $gt: 0 }
      });
    });

    it('should filter by stock status - out of stock', async () => {
      setupProductMocks();

      await request(app)
        .get('/api/admin/products?stockStatus=out_of_stock')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Product.find).toHaveBeenCalledWith({
        stockQuantity: 0
      });
    });

    it('should filter by stock status - low stock', async () => {
      setupProductMocks();

      await request(app)
        .get('/api/admin/products?stockStatus=low_stock')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(Product.find).toHaveBeenCalledWith({
        stockQuantity: { $gt: 0, $lte: 10 }
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
        process.env.JWT_SECRET || 'test-secret'
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