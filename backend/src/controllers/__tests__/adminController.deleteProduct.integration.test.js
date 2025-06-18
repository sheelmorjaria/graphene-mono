import { describe, it, test, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../../server.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../test/setup.js';

describe('Admin Controller - Delete Product', () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  let adminUser;
  let adminToken;
  let testProduct;

  beforeEach(async () => {
    await clearTestDatabase();
    // Create admin user
    adminUser = new User({
      email: 'admin@test.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      emailVerified: true
    });
    await adminUser.save();

    // Generate admin token
    adminToken = jwt.sign(
      { 
        userId: adminUser._id,
        role: adminUser.role,
        email: adminUser.email
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );

    // Create test product with unique identifiers
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    testProduct = new Product({
      name: 'Test Product',
      slug: `test-product-${uniqueId}`,
      sku: `TEST-${uniqueId}`,
      shortDescription: 'A test product',
      longDescription: 'A detailed description of the test product',
      price: 99.99,
      stockQuantity: 10,
      condition: 'new',
      status: 'active',
      stockStatus: 'in_stock'
    });
    await testProduct.save();
  });

  describe('DELETE /api/admin/products/:productId', () => {
    describe('Successful Product Deletion', () => {
      test('should successfully archive an active product', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert
        expect(response.body).toEqual({
          success: true,
          message: 'Product archived successfully'
        });

        // Verify product is archived
        const archivedProduct = await Product.findById(testProduct._id);
        expect(archivedProduct.status).toBe('archived');
        expect(archivedProduct.isActive).toBe(false);
      });

      test('should successfully archive a draft product', async () => {
        // Arrange
        testProduct.status = 'draft';
        await testProduct.save();

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
        
        const archivedProduct = await Product.findById(testProduct._id);
        expect(archivedProduct.status).toBe('archived');
      });

      test('should work with products that have no description', async () => {
        // Arrange
        testProduct.shortDescription = '';
        testProduct.longDescription = '';
        await testProduct.save();

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
      });
    });

    describe('Authentication and Authorization', () => {
      test('should require authentication token', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .expect(401);

        // Assert
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('token');
      });

      test('should require valid JWT token', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        // Assert
        expect(response.body.success).toBe(false);
      });

      test('should require admin role', async () => {
        // Arrange
        const customerUser = new User({
          email: 'customer@test.com',
          password: 'password123',
          firstName: 'Customer',
          lastName: 'User',
          role: 'customer',
          emailVerified: true
        });
        await customerUser.save();

        const customerToken = jwt.sign(
          { 
            userId: customerUser._id,
            role: customerUser.role,
            email: customerUser.email
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '8h' }
        );

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .set('Authorization', `Bearer ${customerToken}`)
          .expect(403);

        // Assert
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('permissions');
      });

      test('should handle expired tokens', async () => {
        // Arrange
        const expiredToken = jwt.sign(
          { 
            userId: adminUser._id,
            role: adminUser.role,
            email: adminUser.email
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '-1h' }
        );

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .set('Authorization', `Bearer ${expiredToken}`)
          .expect(401);

        // Assert
        expect(response.body.success).toBe(false);
      });
    });

    describe('Validation Errors', () => {
      test('should return 400 for invalid ObjectId format', async () => {
        // Act
        const response = await request(app)
          .delete('/api/admin/products/invalid-id')
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
        const nonExistentId = '507f1f77bcf86cd799439011';

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${nonExistentId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        // Assert
        expect(response.body).toEqual({
          success: false,
          error: 'Product not found'
        });
      });

      test('should return 400 when product is already archived', async () => {
        // Arrange
        testProduct.status = 'archived';
        testProduct.isActive = false;
        await testProduct.save();

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        // Assert
        expect(response.body).toEqual({
          success: false,
          error: 'Product is already archived'
        });
      });
    });

    describe('Database Integration', () => {
      test('should persist archived status in database', async () => {
        // Act
        await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert
        const updatedProduct = await Product.findById(testProduct._id);
        expect(updatedProduct.status).toBe('archived');
        expect(updatedProduct.isActive).toBe(false);
        expect(updatedProduct.name).toBe('Test Product'); // Other fields preserved
        expect(updatedProduct.sku).toBe('TEST-001');
        expect(updatedProduct.price).toBe(99.99);
      });

      test('should exclude archived products from default queries', async () => {
        // Act
        await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert - Check that archived products are excluded from default queries
        const activeProducts = await Product.find({ status: { $ne: 'archived' } });
        expect(activeProducts.find(p => p._id.toString() === testProduct._id.toString())).toBeUndefined();

        // But can still be found when specifically searching for archived
        const archivedProducts = await Product.find({ status: 'archived' });
        expect(archivedProducts.find(p => p._id.toString() === testProduct._id.toString())).toBeDefined();
      });

      test('should maintain referential integrity', async () => {
        // Act
        await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert - Product should still exist with same ID
        const archivedProduct = await Product.findById(testProduct._id);
        expect(archivedProduct).toBeDefined();
        expect(archivedProduct._id.toString()).toBe(testProduct._id.toString());
      });
    });

    describe('Edge Cases', () => {
      test('should handle products with special characters in name', async () => {
        // Arrange
        testProduct.name = 'Product with "quotes" & <special> chars';
        await testProduct.save();

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
      });

      test('should handle products with long names within limits', async () => {
        // Arrange
        testProduct.name = 'A'.repeat(190); // Within 200 char limit
        await testProduct.save();

        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
      });

      test('should handle concurrent deletion attempts', async () => {
        // Act - Send multiple concurrent requests
        const promises = Array(3).fill().map(() => 
          request(app)
            .delete(`/api/admin/products/${testProduct._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
        );

        const responses = await Promise.all(promises);

        // Assert - First request should succeed, others should fail
        const successResponses = responses.filter(r => r.status === 200);
        const errorResponses = responses.filter(r => r.status === 400);
        
        expect(successResponses).toHaveLength(1);
        expect(errorResponses).toHaveLength(2);
        
        // All error responses should indicate product already archived
        errorResponses.forEach(response => {
          expect(response.body.error).toBe('Product is already archived');
        });
      });
    });

    describe('Response Format', () => {
      test('should return JSON response with correct structure', async () => {
        // Act
        const response = await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert
        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Product archived successfully');
        expect(response.body).not.toHaveProperty('data');
      });

      test('should return consistent error format', async () => {
        // Act
        const response = await request(app)
          .delete('/api/admin/products/invalid-id')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        // Assert
        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
      });
    });

    describe('Soft Delete Behavior', () => {
      test('should use soft delete instead of hard delete', async () => {
        // Arrange
        const originalProductId = testProduct._id;

        // Act
        await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert - Product should still exist in database
        const productExists = await Product.findById(originalProductId);
        expect(productExists).toBeDefined();
        expect(productExists.status).toBe('archived');
      });

      test('should preserve all product data during archival', async () => {
        // Arrange
        const originalData = {
          name: testProduct.name,
          sku: testProduct.sku,
          price: testProduct.price,
          stockQuantity: testProduct.stockQuantity,
          condition: testProduct.condition,
          shortDescription: testProduct.shortDescription,
          longDescription: testProduct.longDescription
        };

        // Act
        await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert
        const archivedProduct = await Product.findById(testProduct._id);
        expect(archivedProduct.name).toBe(originalData.name);
        expect(archivedProduct.sku).toBe(originalData.sku);
        expect(archivedProduct.price).toBe(originalData.price);
        expect(archivedProduct.stockQuantity).toBe(originalData.stockQuantity);
        expect(archivedProduct.condition).toBe(originalData.condition);
        expect(archivedProduct.shortDescription).toBe(originalData.shortDescription);
        expect(archivedProduct.longDescription).toBe(originalData.longDescription);
      });

      test('should update both status and isActive fields', async () => {
        // Arrange
        expect(testProduct.status).toBe('active');
        expect(testProduct.isActive).toBe(true);

        // Act
        await request(app)
          .delete(`/api/admin/products/${testProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Assert
        const archivedProduct = await Product.findById(testProduct._id);
        expect(archivedProduct.status).toBe('archived');
        expect(archivedProduct.isActive).toBe(false);
      });
    });
  });
});