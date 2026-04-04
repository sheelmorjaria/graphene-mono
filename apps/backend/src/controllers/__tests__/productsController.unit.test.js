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
      // Mock product data with variations as expected by controller
      const mockProducts = [{
        _id: 'product1',
        name: 'iPhone 14',
        slug: 'iphone-14',
        shortDescription: 'Latest iPhone',
        baseModel: 'iPhone 14',
        images: ['image1.jpg'],
        category: { name: 'Smartphones', slug: 'smartphones' },
        createdAt: new Date('2023-01-01'),
        variations: [{
          _id: 'var1',
          condition: 'new',
          color: 'black',
          storage: '128gb',
          price: 999,
          salePrice: null,
          stockStatus: 'in-stock',
          stockQuantity: 10,
          sku: 'IP14-128-BLK',
          images: ['image1.jpg']
        }],
        // Mock methods expected by controller
        getPriceRange: vi.fn().mockReturnValue({ min: 999, max: 999 }),
        getAvailableColors: vi.fn().mockReturnValue(['black']),
        getAvailableConditions: vi.fn().mockReturnValue(['new']),
        getAvailableStorage: vi.fn().mockReturnValue(['128gb']),
        getAvailableCapacities: vi.fn().mockReturnValue([]),
        getAvailableInterfaces: vi.fn().mockReturnValue([]),
        isInStock: vi.fn().mockReturnValue(true)
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
      Category.findOne.mockResolvedValue(null); // No category filter in this test

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{
          id: 'product1',
          name: 'iPhone 14',
          slug: 'iphone-14',
          shortDescription: 'Latest iPhone',
          baseModel: 'iPhone 14',
          priceRange: { min: 999, max: 999 },
          images: ['image1.jpg'],
          variations: [{
            condition: 'new',
            color: 'black',
            storage: '128gb',
            price: 999,
            salePrice: null,
            stockStatus: 'in-stock',
            stockQuantity: 10,
            sku: 'IP14-128-BLK',
            _id: 'var1',
            images: ['image1.jpg']
          }],
          availableColors: ['black'],
          availableConditions: ['new'],
          availableStorage: ['128gb'],
          isInStock: true,
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
      Category.findOne.mockResolvedValue(null); // No category filter in this test

      req.query = { minPrice: '100', maxPrice: '500' };

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle pagination parameters', async () => {
      // Mock products with variations for price sorting
      const mockProducts = Array.from({ length: 5 }, (_, i) => ({
        _id: `product${i}`,
        name: `Product ${i}`,
        slug: `product-${i}`,
        shortDescription: `Product ${i} description`,
        baseModel: `Product ${i}`,
        images: [`image${i}.jpg`],
        category: { name: 'Test Category', slug: 'test-category' },
        createdAt: new Date('2023-01-01'),
        variations: [{
          _id: `var${i}`,
          condition: 'new',
          color: 'black',
          storage: '128gb',
          price: 100 + i * 10,
          salePrice: null,
          stockStatus: 'in-stock',
          stockQuantity: 10,
          sku: `PROD${i}-128-BLK`,
          images: [`image${i}.jpg`]
        }],
        // Mock methods expected by controller
        getPriceRange: vi.fn().mockReturnValue({ min: 100 + i * 10, max: 100 + i * 10 }),
        getAvailableColors: vi.fn().mockReturnValue(['black']),
        getAvailableConditions: vi.fn().mockReturnValue(['new']),
        getAvailableStorage: vi.fn().mockReturnValue(['128gb']),
        getAvailableCapacities: vi.fn().mockReturnValue([]),
        getAvailableInterfaces: vi.fn().mockReturnValue([]),
        isInStock: vi.fn().mockReturnValue(true)
      }));

      const productQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(mockProducts)
      };
      Product.find.mockReturnValue(productQuery);
      Product.countDocuments.mockResolvedValue(23); // 5 pages with limit 5
      Category.findOne.mockResolvedValue(null); // No category filter in this test

      req.query = { page: '2', limit: '5', sortBy: 'createdAt' }; // Use non-price sorting to avoid complex price sorting logic

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