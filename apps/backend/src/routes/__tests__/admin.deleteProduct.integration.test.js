import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import adminRoutes from '../admin.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';

// NOTE: the route DELETE /api/admin/products/:productId is implemented by
// adminProductController.deleteProduct (wired in routes/admin.js). Its real
// behavior/messages differ from adminController.deleteProduct. These tests
// assert the behavior of the ACTUALLY MOUNTED route.

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Admin Routes - Delete Product Integration Tests', () => {
  let adminToken;
  let adminUser;
  let mockProduct;

  beforeAll(() => {
    // Setup admin user object (User.findById is mocked to return this)
    adminUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'admin@example.com',
      role: 'admin',
      isActive: true
    };

    adminToken = jwt.sign(
      {
        userId: adminUser._id,
        role: adminUser.role,
        email: adminUser.email
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // The mounted controller (adminProductController.deleteProduct) validates
    // the ObjectId format itself, then calls Product.findById.
    vi.spyOn(Product, 'findById').mockResolvedValue(null);

    // authenticate middleware calls User.findById -> must resolve to an
    // active admin user.
    vi.spyOn(User, 'findById').mockResolvedValue(adminUser);

    // Setup mock product with the methods the controller/model use
    mockProduct = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Product',
      sku: 'TEST-001',
      price: 99.99,
      stockQuantity: 10,
      status: 'active',
      isActive: true,
      isArchived: vi.fn(),
      softDelete: vi.fn(),
      save: vi.fn()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('DELETE /api/admin/products/:productId', () => {
    describe('Successful Deletion', () => {
      it('should successfully delete (archive) a product', async () => {
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'Product deleted successfully'
        });
        expect(Product.findById).toHaveBeenCalledWith(mockProduct._id.toString());
        expect(mockProduct.softDelete).toHaveBeenCalled();
      });

      it('should handle product with missing name gracefully', async () => {
        mockProduct.name = undefined;
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should work with different product statuses', async () => {
        mockProduct.status = 'draft';
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(mockProduct.softDelete).toHaveBeenCalled();
      });
    });

    describe('Authentication and Authorization', () => {
      it('should require authentication token', async () => {
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .expect(401);

        expect(response.body.error).toMatch(/token/i);
        expect(Product.findById).not.toHaveBeenCalled();
      });

      it('should require valid JWT token', async () => {
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.error).toBeDefined();
        expect(Product.findById).not.toHaveBeenCalled();
      });

      it('should require admin role', async () => {
        const customerUser = {
          ...adminUser,
          role: 'customer'
        };
        User.findById.mockResolvedValue(customerUser);

        const customerToken = jwt.sign(
          { userId: customerUser._id, role: 'customer' },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '1h' }
        );

        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${customerToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(Product.findById).not.toHaveBeenCalled();
      });

      it('should handle expired tokens', async () => {
        const expiredToken = jwt.sign(
          { userId: adminUser._id, role: 'admin' },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '-1h' }
        );

        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${expiredToken}`)
          .expect(401);

        expect(response.body.error).toBeDefined();
        expect(Product.findById).not.toHaveBeenCalled();
      });
    });

    describe('Validation Errors', () => {
      it('should return 404 for missing product ID segment', async () => {
        await request(app)
          .delete('/api/admin/products/')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404); // Express returns 404 for route not found

        expect(Product.findById).not.toHaveBeenCalled();
      });

      it('should return 400 for invalid ObjectId format', async () => {
        const invalidId = 'invalid-object-id';

        const response = await request(app)
          .delete(`/api/admin/products/${invalidId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        // Mounted controller returns "Invalid product ID"
        expect(response.body).toEqual({
          success: false,
          error: 'Invalid product ID'
        });
        expect(Product.findById).not.toHaveBeenCalled();
      });

      it('should return 404 when product does not exist', async () => {
        Product.findById.mockResolvedValue(null);

        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body).toEqual({
          success: false,
          error: 'Product not found'
        });
        expect(Product.findById).toHaveBeenCalledWith(mockProduct._id.toString());
      });
    });

    describe('Database Errors', () => {
      it('should handle database connection errors', async () => {
        const dbError = new Error('Database connection failed');
        Product.findById.mockRejectedValue(dbError);

        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(500);

        expect(response.body).toEqual({
          success: false,
          error: 'Server error occurred while deleting product'
        });
      });

      it('should handle soft delete operation failures', async () => {
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockRejectedValue(new Error('Soft delete failed'));
        Product.findById.mockResolvedValue(mockProduct);

        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(500);

        expect(response.body).toEqual({
          success: false,
          error: 'Server error occurred while deleting product'
        });
        expect(mockProduct.softDelete).toHaveBeenCalled();
      });

      it('should handle network timeout errors', async () => {
        const timeoutError = new Error('Request timeout');
        timeoutError.code = 'ETIMEDOUT';
        Product.findById.mockRejectedValue(timeoutError);

        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(500);

        expect(response.body).toEqual({
          success: false,
          error: 'Server error occurred while deleting product'
        });
      });
    });

    describe('Request Headers and Content Type', () => {
      it('should accept requests without Content-Type header', async () => {
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should work with application/json Content-Type', async () => {
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .set('Content-Type', 'application/json')
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should ignore request body for DELETE requests', async () => {
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ someData: 'should be ignored' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('Response Format', () => {
      it('should return JSON response with correct structure', async () => {
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Product deleted successfully');
      });

      it('should return consistent error format', async () => {
        Product.findById.mockResolvedValue(null);

        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
      });
    });

    describe('Edge Cases and Performance', () => {
      it('should handle very long product IDs', async () => {
        const longId = 'a'.repeat(100);

        const response = await request(app)
          .delete(`/api/admin/products/${longId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.error).toBe('Invalid product ID');
      });

      it('should handle concurrent deletion attempts', async () => {
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        const promises = Array(5).fill().map(() =>
          request(app)
            .delete(`/api/admin/products/${mockProduct._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
        );

        const responses = await Promise.all(promises);

        responses.forEach(response => {
          expect(response.status).toBe(200);
        });

        expect(Product.findById).toHaveBeenCalledTimes(5);
      });

      it('should handle requests with special characters in product ID', async () => {
        const specialId = '507f1f77bcf86cd799439011%20special';

        const response = await request(app)
          .delete(`/api/admin/products/${specialId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.error).toBe('Invalid product ID');
      });
    });
  });
});
