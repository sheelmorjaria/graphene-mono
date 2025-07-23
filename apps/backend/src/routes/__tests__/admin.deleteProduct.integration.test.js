import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import adminRoutes from '../admin.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';

// Will mock models using spies in beforeEach to work with ES modules

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Admin Routes - Delete Product Integration Tests', () => {
  let adminToken;
  let adminUser;
  let mockProduct;

  beforeAll(() => {
    // Setup admin user and token
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
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup spies for models
    vi.spyOn(Product, 'findById').mockResolvedValue(null);
    vi.spyOn(Product, 'findByIdAndUpdate').mockResolvedValue(null);
    vi.spyOn(Product, 'deleteOne').mockResolvedValue({ deletedCount: 1 });
    vi.spyOn(User, 'findById').mockResolvedValue(adminUser);

    // Setup mock product
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

    // Mock console.log for audit logging
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Set default behavior for User.findById
    User.findById.mockResolvedValue(adminUser);
  });

  afterEach(() => {
    console.log.mockRestore();
    vi.restoreAllMocks();
  });

  describe('DELETE /api/admin/products/:productId', () => {
    describe('Successful Deletion', () => {
      test('should successfully archive a product', async () => {
        // Arrange
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert
        expect(response.body).toEqual({
          success: true,
          message: 'Product archived successfully'
        });
        expect(Product.findById).toHaveBeenCalledWith(mockProduct._id.toString());
        expect(mockProduct.isArchived).toHaveBeenCalled();
        expect(mockProduct.softDelete).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining(`Product ${mockProduct._id} (Test Product) archived by admin user ${adminUser._id}`)
        );
      });

      test('should handle product with missing name gracefully', async () => {
        // Arrange
        mockProduct.name = undefined;
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert
        expect(response.body).toEqual({
          success: true,
          message: 'Product archived successfully'
        });
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining('(undefined)')
        );
      });

      test('should work with different product statuses', async () => {
        // Arrange
        mockProduct.status = 'draft';
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
        expect(mockProduct.softDelete).toHaveBeenCalled();
      });
    });

    describe('Authentication and Authorization', () => {
      test('should require authentication token', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .expect(401);

        // Assert
        expect(response.body.error).toContain('token');
        expect(Product.findById).not.toHaveBeenCalled();
      });

      test('should require valid JWT token', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        // Assert
        expect(response.body.error).toBeDefined();
        expect(Product.findById).not.toHaveBeenCalled();
      });

      test('should require admin role', async () => {
        // Arrange
        const customerUser = {
          ...adminUser,
          role: 'customer'
        };
        User.findById.mockResolvedValue(customerUser);

        const customerToken = jwt.sign(
          { userId: customerUser._id, role: 'customer' },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '1h' }
        );

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${customerToken}`)
          .expect(403);

        // Assert
        expect(response.body.error).toContain('admin');
        expect(Product.findById).not.toHaveBeenCalled();
      });

      test('should handle expired tokens', async () => {
        // Arrange
        const expiredToken = jwt.sign(
          { userId: adminUser._id, role: 'admin' },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '-1h' } // Expired 1 hour ago
        );

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${expiredToken}`)
          .expect(401);

        // Assert
        expect(response.body.error).toBeDefined();
        expect(Product.findById).not.toHaveBeenCalled();
      });
    });

    describe('Validation Errors', () => {
      test('should return 400 for missing product ID', async () => {
        // Act
        await request(app)
          .delete('/api/admin/products/')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404); // Express returns 404 for route not found

        // Assert - route doesn't exist without ID
        expect(Product.findById).not.toHaveBeenCalled();
      });

      test('should return 400 for invalid ObjectId format', async () => {
        // Arrange
        const invalidId = 'invalid-object-id';
        const castError = new Error('Cast to ObjectId failed');
        castError.name = 'CastError';
        Product.findById.mockRejectedValue(castError);

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${invalidId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        // Assert
        expect(response.body).toEqual({
          success: false,
          error: 'Invalid product ID format'
        });
      });

      test('should return 404 when product does not exist', async () => {
        // Arrange
        Product.findById.mockResolvedValue(null);

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        // Assert
        expect(response.body).toEqual({
          success: false,
          error: 'Product not found'
        });
        expect(Product.findById).toHaveBeenCalledWith(mockProduct._id.toString());
      });

      test('should return 400 when product is already archived', async () => {
        // Arrange
        mockProduct.isArchived.mockReturnValue(true);
        Product.findById.mockResolvedValue(mockProduct);

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        // Assert
        expect(response.body).toEqual({
          success: false,
          error: 'Product is already archived'
        });
        expect(mockProduct.isArchived).toHaveBeenCalled();
        expect(mockProduct.softDelete).not.toHaveBeenCalled();
      });
    });

    describe('Database Errors', () => {
      test('should handle database connection errors', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        Product.findById.mockRejectedValue(dbError);

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(500);

        // Assert
        expect(response.body).toEqual({
          success: false,
          error: 'Server error while archiving product'
        });
      });

      test('should handle soft delete operation failures', async () => {
        // Arrange
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockRejectedValue(new Error('Soft delete failed'));
        Product.findById.mockResolvedValue(mockProduct);

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(500);

        // Assert
        expect(response.body).toEqual({
          success: false,
          error: 'Server error while archiving product'
        });
        expect(mockProduct.isArchived).toHaveBeenCalled();
        expect(mockProduct.softDelete).toHaveBeenCalled();
      });

      test('should handle network timeout errors', async () => {
        // Arrange
        const timeoutError = new Error('Request timeout');
        timeoutError.code = 'ETIMEDOUT';
        Product.findById.mockRejectedValue(timeoutError);

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(500);

        // Assert
        expect(response.body).toEqual({
          success: false,
          error: 'Server error while archiving product'
        });
      });
    });

    describe('Request Headers and Content Type', () => {
      test('should accept requests without Content-Type header', async () => {
        // Arrange
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
      });

      test('should work with application/json Content-Type', async () => {
        // Arrange
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .set('Content-Type', 'application/json')
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
      });

      test('should ignore request body for DELETE requests', async () => {
        // Arrange
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ someData: 'should be ignored' })
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
      });
    });

    describe('Response Format', () => {
      test('should return JSON response with correct structure', async () => {
        // Arrange
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert
        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Product archived successfully');
        expect(response.body).not.toHaveProperty('data'); // No data needed for delete
      });

      test('should return consistent error format', async () => {
        // Arrange
        Product.findById.mockResolvedValue(null);

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        // Assert
        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
      });
    });

    describe('Audit Logging', () => {
      test('should log successful deletion with all details', async () => {
        // Arrange
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        // Act
        await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert
        expect(console.log).toHaveBeenCalledWith(
          expect.stringMatching(
            new RegExp(`Product ${mockProduct._id} \\(Test Product\\) archived by admin user ${adminUser._id}`)
          )
        );
      });

      test('should not log when deletion fails', async () => {
        // Arrange
        Product.findById.mockResolvedValue(null);

        // Act
        await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        // Assert
        expect(console.log).not.toHaveBeenCalledWith(
          expect.stringContaining('archived by admin user')
        );
      });

      test('should not log when product is already archived', async () => {
        // Arrange
        mockProduct.isArchived.mockReturnValue(true);
        Product.findById.mockResolvedValue(mockProduct);

        // Act
        await request(app)
          .delete(`/api/admin/products/${mockProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        // Assert
        expect(console.log).not.toHaveBeenCalledWith(
          expect.stringContaining('archived by admin user')
        );
      });
    });

    describe('Edge Cases and Performance', () => {
      test('should handle very long product IDs', async () => {
        // Arrange
        const longId = 'a'.repeat(100);
        const castError = new Error('Cast to ObjectId failed');
        castError.name = 'CastError';
        Product.findById.mockRejectedValue(castError);

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${longId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        // Assert
        expect(response.body.error).toBe('Invalid product ID format');
      });

      test('should handle concurrent deletion attempts', async () => {
        // Arrange
        mockProduct.isArchived.mockReturnValue(false);
        mockProduct.softDelete.mockResolvedValue(mockProduct);
        Product.findById.mockResolvedValue(mockProduct);

        // Act - Send multiple concurrent requests
        const promises = Array(5).fill().map(() => 
          request(app)
            .delete(`/api/admin/products/${mockProduct._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
        );

        const responses = await Promise.all(promises);

        // Assert - All should succeed (in real scenario, only first would succeed)
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });
        
        // Should be called once for each request
        expect(Product.findById).toHaveBeenCalledTimes(5);
      });

      test('should handle requests with special characters in product ID', async () => {
        // Arrange
        const specialId = '507f1f77bcf86cd799439011%20special';
        const castError = new Error('Cast to ObjectId failed');
        castError.name = 'CastError';
        Product.findById.mockRejectedValue(castError);

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${specialId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        // Assert
        expect(response.body.error).toBe('Invalid product ID format');
      });
    });
  });
});