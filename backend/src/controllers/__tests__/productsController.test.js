import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { getProducts } from '../productsController.js';
import Product from '../../models/Product.js';

describe('Products Controller', () => {
  let app;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/graphene-store-test');
  });

  afterAll(async () => {
    await Product.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    app = express();
    app.use(express.json());
    app.get('/api/products', getProducts);
  });

  describe('GET /api/products', () => {
    it('should return paginated products with default parameters', async () => {
      // Create real test products
      await Product.create([
        {
          name: 'GrapheneOS Pixel 9 Pro',
          slug: 'grapheneos-pixel-9-pro',
          shortDescription: 'Privacy-focused smartphone',
          longDescription: 'A detailed description',
          price: 899.99,
          images: ['image1.jpg'],
          condition: 'new',
          stockStatus: 'in_stock',
          isActive: true
        },
        {
          _id: '2',
          name: 'GrapheneOS Pixel 9',
          slug: 'grapheneos-pixel-9',
          shortDescription: 'Privacy-focused smartphone',
          price: 799.99,
          images: ['image2.jpg'],
          condition: 'excellent',
          stockStatus: 'in_stock',
          isActive: true,
          createdAt: new Date(),
          toObject: function() { return this; }
        }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProducts)
      };

      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(2);

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 12,
        total: 2,
        pages: 1
      });
      
      // Verify default query parameters
      expect(Product.find).toHaveBeenCalledWith({ isActive: true });
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(12);
    });

    it('should handle pagination parameters', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };

      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(0);

      await request(app)
        .get('/api/products')
        .query({ page: 2, limit: 6 });

      expect(mockQuery.skip).toHaveBeenCalledWith(6); // (page-1) * limit = (2-1) * 6
      expect(mockQuery.limit).toHaveBeenCalledWith(6);
    });

    it('should handle sorting parameters', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };

      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(0);

      await request(app)
        .get('/api/products')
        .query({ sortBy: 'price', sortOrder: 'asc' });

      expect(mockQuery.sort).toHaveBeenCalledWith({ price: 1 });
    });

    it('should handle category filtering', async () => {
      const categoryId = '507f1f77bcf86cd799439011';
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };

      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(0);

      await request(app)
        .get('/api/products')
        .query({ category: categoryId });

      expect(Product.find).toHaveBeenCalledWith({ 
        isActive: true, 
        category: categoryId 
      });
    });

    it('should handle price range filtering', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };

      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(0);

      await request(app)
        .get('/api/products')
        .query({ minPrice: 100, maxPrice: 500 });

      expect(Product.find).toHaveBeenCalledWith({ 
        isActive: true, 
        price: { $gte: 100, $lte: 500 } 
      });
    });

    it('should handle condition filtering', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };

      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(0);

      await request(app)
        .get('/api/products')
        .query({ condition: 'excellent' });

      expect(Product.find).toHaveBeenCalledWith({ 
        isActive: true, 
        condition: 'excellent' 
      });
    });

    it('should return 500 on database error', async () => {
      Product.find.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });

    it('should validate and sanitize query parameters', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };

      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(0);

      // Test invalid page number
      await request(app)
        .get('/api/products')
        .query({ page: 'invalid', limit: 'invalid' });

      // Should default to page 1, limit 12
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(12);
    });
  });
});