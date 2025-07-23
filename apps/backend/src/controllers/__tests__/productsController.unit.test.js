import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock models first
vi.mock('../../models/Product.js');
vi.mock('../../models/Category.js');

// Import controller after mocking
const { getProducts } = await import('../productsController.js');

// Get references to the mocked modules
const Product = (await import('../../models/Product.js')).default;
const Category = (await import('../../models/Category.js')).default;

describe('Products Controller Simple Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    
    req = {
      query: {}
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
  });

  describe('getProducts', () => {
    it('should return products successfully with default pagination', async () => {
      // Mock product data
      const mockProducts = [{
        _id: 'product1',
        name: 'iPhone 14',
        slug: 'iphone-14',
        shortDescription: 'Latest iPhone',
        price: 999,
        images: ['image1.jpg'],
        condition: 'new',
        stockStatus: 'in-stock',
        category: { name: 'Smartphones', slug: 'smartphones' },
        createdAt: new Date('2023-01-01')
      }];

      // Set up mongoose query chain mock
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(mockProducts)
      };
      
      Product.find.mockReturnValue(mockQuery);
      Product.countDocuments.mockResolvedValue(1);

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{
          id: 'product1',
          name: 'iPhone 14',
          slug: 'iphone-14',
          shortDescription: 'Latest iPhone',
          price: 999,
          images: ['image1.jpg'],
          condition: 'new',
          stockStatus: 'in-stock',
          category: { name: 'Smartphones', slug: 'smartphones' },
          createdAt: new Date('2023-01-01')
        }],
        pagination: {
          page: 1,
          limit: 12,
          total: 1,
          pages: 1,
          hasNext: false,
          hasPrev: false
        }
      });
    });

    it('should handle category filtering', async () => {
      const mockCategory = { _id: 'cat123', slug: 'smartphones' };
      const categoryQuery = {
        exec: vi.fn().mockResolvedValue(mockCategory)
      };
      Category.findOne.mockReturnValue(categoryQuery);
      
      const productQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([])
      };
      Product.find.mockReturnValue(productQuery);
      Product.countDocuments.mockResolvedValue(0);

      req.query = { category: 'smartphones' };

      await getProducts(req, res);

      expect(Category.findOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle price filtering', async () => {
      const productQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([])
      };
      Product.find.mockReturnValue(productQuery);
      Product.countDocuments.mockResolvedValue(0);

      req.query = { minPrice: '100', maxPrice: '500' };

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle pagination parameters', async () => {
      const productQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([])
      };
      Product.find.mockReturnValue(productQuery);
      Product.countDocuments.mockResolvedValue(23); // 5 pages with limit 5

      req.query = { page: '2', limit: '5' };

      await getProducts(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            page: 2,
            limit: 5,
            pages: 5,
            total: 23,
            hasNext: true,
            hasPrev: true
          })
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const productQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockRejectedValue(new Error('Database error'))
      };
      Product.find.mockReturnValue(productQuery);

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });

    it('should handle category lookup errors', async () => {
      const categoryQuery = {
        exec: vi.fn().mockRejectedValue(new Error('Category error'))
      };
      Category.findOne.mockReturnValue(categoryQuery);
      
      req.query = { category: 'smartphones' };

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });

    it('should return empty results for non-existent category', async () => {
      const categoryQuery = {
        exec: vi.fn().mockResolvedValue(null)
      };
      Category.findOne.mockReturnValue(categoryQuery);
      
      const productQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([])
      };
      Product.find.mockReturnValue(productQuery);
      Product.countDocuments.mockResolvedValue(0);

      req.query = { category: 'nonexistent' };

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [],
          pagination: expect.objectContaining({
            total: 0
          })
        })
      );
    });

    it('should validate and sanitize pagination parameters', async () => {
      const productQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([])
      };
      Product.find.mockReturnValue(productQuery);
      Product.countDocuments.mockResolvedValue(0);

      // Test invalid parameters get sanitized
      req.query = { page: '-1', limit: '200' };

      await getProducts(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            page: 1, // Math.max(1, -1)
            limit: 100 // Math.min(100, 200) - capped at 100
          })
        })
      );
    });

    it('should filter by valid condition values', async () => {
      const productQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([])
      };
      Product.find.mockReturnValue(productQuery);
      Product.countDocuments.mockResolvedValue(0);

      req.query = { condition: 'excellent' };

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should ignore invalid condition values', async () => {
      const productQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([])
      };
      Product.find.mockReturnValue(productQuery);
      Product.countDocuments.mockResolvedValue(0);

      req.query = { condition: 'invalid-condition' };

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});